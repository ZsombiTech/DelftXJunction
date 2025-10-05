import copy
import sys
import hashlib
import json
from src.models.rides_trips import RidesTrips
from src.ml.data import get_travel_time, point_near_zone
from src.ml.zone_density_cache import get_current_zone_densities, initialize_zone_density_cache, get_zone_densities_for_time
from src.utils.logger import logger
from fastapi import APIRouter
from src.models import Cities, Earners
from datetime import datetime, timedelta
from shapely.geometry import Polygon, MultiPolygon
import random
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from itertools import combinations, product

router = APIRouter(prefix="/predictions", tags=["predictions"])

progress_counter = 0


async def update_driver_states_from_trips(time):
    """
    Load trips table into memory and update driver states.
    Changes drivers from 'engaged' to 'online' when their trips are completed.
    """
    logger.info("Loading trips data and updating driver states...")

    # Get all trips and load into memory
    trips = await RidesTrips.all().select_related('driver')

    # Track drivers who had trips
    drivers_with_completed_trips = set()
    drivers_with_active_trips = set()

    for trip in trips:
        trip_end_time = trip.end_time.replace(
            tzinfo=None) if trip.end_time and trip.end_time.tzinfo else trip.end_time
        trip_start_time = trip.start_time.replace(
            tzinfo=None) if trip.start_time and trip.start_time.tzinfo else trip.start_time
        current_time = time.replace(tzinfo=None) if time.tzinfo else time

        if trip_end_time and trip_end_time <= current_time:
            # Trip is completed
            drivers_with_completed_trips.add(trip.driver.earner_id)
        elif trip_start_time and trip_start_time < current_time and trip_end_time and trip_end_time > current_time:
            # Trip is active (started but not ended, or ends in future)
            drivers_with_active_trips.add(trip.driver.earner_id)

        # Update driver states
        updated_count = 0

        # Set drivers with active trips to 'engaged'
    for driver_id in drivers_with_active_trips:
        await Earners.filter(earner_id=driver_id).update(status="engaged")
        updated_count += 1
        logger.debug(f"Set driver {driver_id} to 'engaged' (active trip)")

        # Set drivers with only completed trips (no active trips) to 'online'
        drivers_to_online = drivers_with_completed_trips - drivers_with_active_trips
    for driver_id in drivers_to_online:
        # with 50% chance, make driver go offline for break
        if random.random() < 0.5:
            await Earners.filter(earner_id=driver_id).update(status="offline")
            updated_count += 1
            logger.debug(f"Set driver {driver_id} to 'offline' for break")
        else:
            await Earners.filter(earner_id=driver_id).update(status="online")
            updated_count += 1
            logger.debug(
                f"Set driver {driver_id} to 'online' (trip completed)")

    logger.info(
        f"Updated {updated_count} driver states based on trip data")
    logger.info(
        f"Active trips: {len(drivers_with_active_trips)}, Completed trips: {len(drivers_to_online)}")

    return {
        "trips_loaded": len(trips),
        "drivers_engaged": len(drivers_with_active_trips),
        "drivers_online": len(drivers_to_online),
        "total_updated": updated_count
    }


@dataclass
class DriverState:
    """Lightweight driver state representation"""
    earner_id: str
    status: str
    latitude: float
    longitude: float
    current_zone: Optional[int] = None
    destination_zone: Optional[int] = None


@dataclass
class Action:
    """Represents a single driver action"""
    driver_id: str
    from_zone: Optional[int]
    to_zone: int
    cost: float
    time: datetime


@dataclass
class ActionBatch:
    """Represents multiple simultaneous actions in one time step"""
    actions: List[Action]
    total_cost: float
    time: datetime


@dataclass
class GameState:
    """Immutable game state representation"""
    driver_assignments: Dict[str, Optional[int]
                             ]  # driver_id -> destination_zone
    time: datetime

    def copy_with_assignment(self, driver_id: str, zone_id: Optional[int]) -> 'GameState':
        """Create new state with single driver assignment change"""
        new_assignments = self.driver_assignments.copy()
        new_assignments[driver_id] = zone_id
        return GameState(new_assignments, self.time)


@dataclass
class SearchResult:
    """Result of state space search including optimal actions"""
    score: float
    cost: float
    optimal_action_batches: List[ActionBatch]


# Global cache for zone centroids and distances
zone_centroids_cache: Dict[int, Tuple[float, float]] = {}
zone_distance_cache: Dict[Tuple[int, int], float] = {}
driver_zone_cache: Dict[str, int] = {}
# min_x, max_x, min_y, max_y
zone_bboxes_cache: Dict[int, Tuple[float, float, float, float]] = {}


def precompute_zone_centroids(zones):
    """Pre-compute zone centroids and bounding boxes for faster distance calculations"""
    global zone_centroids_cache, zone_bboxes_cache
    zone_centroids_cache.clear()
    zone_bboxes_cache.clear()

    for zone_id, zone in enumerate(zones):
        zone_shapes = [Polygon(shape["shell"], holes=shape["holes"])
                       for shape in zone]
        zone_multipolygon = MultiPolygon(zone_shapes)
        centroid = zone_multipolygon.centroid
        zone_centroids_cache[zone_id] = (centroid.y, centroid.x)  # lat, lng

        # Pre-compute bounding box for fast spatial queries
        bounds = zone_multipolygon.bounds  # (minx, miny, maxx, maxy)
        zone_bboxes_cache[zone_id] = bounds

    logger.info(
        f"Pre-computed centroids and bounding boxes for {len(zone_centroids_cache)} zones")


def get_driver_zone_optimized(driver_lat: float, driver_lng: float, zones) -> Optional[int]:
    """Optimized zone lookup with bounding box checks and caching"""
    # Create cache key based on rounded coordinates
    cache_key = f"{round(driver_lat, 5)},{round(driver_lng, 5)}"

    if cache_key in driver_zone_cache:
        return driver_zone_cache[cache_key]

    # Use bounding box for fast elimination before expensive geometric operations
    for zone_id in range(len(zones)):
        if zone_id in zone_bboxes_cache:
            minx, miny, maxx, maxy = zone_bboxes_cache[zone_id]
            # Quick bounding box check (lng=x, lat=y)
            if not (minx <= driver_lng <= maxx and miny <= driver_lat <= maxy):
                continue

        # Only do expensive point_near_zone check if bounding box passes
        if point_near_zone([driver_lat, driver_lng], zones[zone_id], 0.01):
            driver_zone_cache[cache_key] = zone_id
            return zone_id

    driver_zone_cache[cache_key] = None
    return None


def precompute_zone_distances(zones, time):
    """Pre-compute travel times between all zone centroids"""
    global zone_distance_cache
    zone_distance_cache.clear()

    for i in range(len(zones)):
        for j in range(len(zones)):
            if i != j and (i, j) not in zone_distance_cache:
                origin = zone_centroids_cache[i]
                destination = zone_centroids_cache[j]
                travel_time = get_travel_time(origin, destination, time)
                zone_distance_cache[(i, j)] = travel_time

    logger.info(
        f"Pre-computed {len(zone_distance_cache)} zone-to-zone distances")


def generate_action_combinations(drivers, zones, time, max_simultaneous_actions=3):
    """Generate all possible combinations of driver actions for one time step"""

    # Get all idle drivers
    idle_drivers = [driver for driver in drivers
                    if driver.status == "online" and driver.destination_zone is None]

    # Generate individual actions for each driver
    all_individual_actions = []
    for driver in idle_drivers:
        driver_zone = get_driver_zone_optimized(
            driver.latitude, driver.longitude, zones)

        for zone_id in range(len(zones)):
            if zone_id != driver_zone:  # Don't move to same zone
                # Calculate cost for this action
                if driver_zone is not None and (driver_zone, zone_id) in zone_distance_cache:
                    cost = zone_distance_cache[(driver_zone, zone_id)]
                else:
                    zone_centroid = zone_centroids_cache.get(zone_id)
                    if zone_centroid:
                        cost = get_travel_time([driver.latitude, driver.longitude],
                                               list(zone_centroid), time)
                    else:
                        cost = 3600  # Default high cost

                action = Action(
                    driver_id=driver.earner_id,
                    from_zone=driver_zone,
                    to_zone=zone_id,
                    cost=cost,
                    time=time
                )
                all_individual_actions.append(action)

    # Generate action batches (combinations of simultaneous actions)
    action_batches = []

    # Add empty action (do nothing)
    action_batches.append(ActionBatch(actions=[], total_cost=0, time=time))

    # Generate combinations of 1 to max_simultaneous_actions
    for num_actions in range(1, min(max_simultaneous_actions + 1, len(idle_drivers) + 1)):
        for action_combo in combinations(all_individual_actions, num_actions):
            # Check that no driver appears twice in the combination
            driver_ids = [action.driver_id for action in action_combo]
            if len(driver_ids) == len(set(driver_ids)):  # No duplicates
                total_cost = sum(action.cost for action in action_combo)
                batch = ActionBatch(
                    actions=list(action_combo),
                    total_cost=total_cost,
                    time=time
                )
                action_batches.append(batch)

    return action_batches


def eval_state(zones, drivers, time, timeframe_count: int = 3) -> float:
    # Timeframe count is how many 10-minute intervals to look ahead for density
    # (default 3 = 30 minutes)
    score = 0
    drivers_in_zones = [0 for _ in range(len(zones))]
    for driver in drivers:
        if driver.status == "online" and driver.destination_zone is None:
            # Driver is idle, count them in the zone
            current_driver_zone = get_driver_zone_optimized(
                driver.latitude, driver.longitude, zones)
            if current_driver_zone is not None:
                drivers_in_zones[current_driver_zone] += 1

    # Get density for current weekday/time and next few intervals
    zone_density = []
    for i in range(timeframe_count):
        densities = get_zone_densities_for_time(
            time + timedelta(minutes=i*10))
        if densities:
            if not zone_density:
                zone_density = densities
            else:
                # Sum densities over the timeframes
                for j in range(len(densities)):
                    try:
                        zone_density[j] += densities[j]
                    except IndexError:
                        # If densities list is shorter than expected, skip
                        pass

    for zone_id, driver_count in enumerate(drivers_in_zones):
        # We check the EV for each zone and compare with driver count
        # EV = expected value = zone density[zone_id]
        # If driver count == EV, score += driver count
        # If driver count > EV, we have oversupply, score += driver count,
        # but above 130% of EV we start penalizing quadratically
        # If driver count < EV, we have undersupply, we penalize this quadratically
        try:
            current_zone_density = zone_density[zone_id]
        except IndexError:
            current_zone_density = 0

        if driver_count == current_zone_density:
            score += driver_count * 3
        elif driver_count > current_zone_density:
            score += driver_count
            if driver_count > 2 * current_zone_density:
                score -= (driver_count - 2 * current_zone_density)
        else:  # driver_count < current_zone_density
            score -= (current_zone_density - driver_count)

    # logger.info(f"Evaluated state at time {time}, score: {score}")
    return score


def get_state_hash_optimized(game_state: GameState) -> str:
    """Generate optimized hash for game state"""
    # Create a tuple of sorted (driver_id, destination_zone) pairs
    sorted_assignments = tuple(sorted(game_state.driver_assignments.items()))
    # Create hash from assignments and time
    hash_input = f"{sorted_assignments}:{game_state.time}"
    return hashlib.md5(hash_input.encode()).hexdigest()


def get_state_hash(drivers, time):
    """Legacy hash function for compatibility"""
    state_data = []
    for driver in drivers:
        # logger.info(
        #     f"Driver {driver.earner_id}:")
        state_data.append({
            'id': driver.earner_id,
            'status': driver.status,
            'destination_zone': getattr(driver, 'destination_zone', None)
        })

    state_data.sort(key=lambda x: x['id'])
    state_str = json.dumps(state_data, sort_keys=True)
    state_str += f":{time}"
    return hashlib.md5(state_str.encode()).hexdigest()


def sss_function(zones, drivers, max_depth, depth, cost, time, visited_states=None, max_simultaneous_actions=3):
    global progress_counter
    progress_counter += 1

    if progress_counter % 10000 == 0:
        logger.info(f"Progress: {progress_counter}, Depth: {depth}")
    if visited_states is None:
        visited_states = set()

    # Generate state hash for cycle detection
    state_hash = get_state_hash(drivers, time)
    # logger.debug(f"State hash at depth {depth}: {state_hash}")
    if state_hash in visited_states:
        return -sys.maxsize - 1, 0, []

    visited_states.add(state_hash)

    if depth == max_depth:
        # logger.info(f"Reached max depth {max_depth}, evaluating state")
        current_time = datetime.now()
        score = eval_state(zones, drivers, current_time)
        return score, cost, []

    best_score = -sys.maxsize - 1
    best_cost = sys.maxsize
    best_action_batches = []

    # Generate all possible action combinations for this time step
    action_batches = generate_action_combinations(
        drivers, zones, time, max_simultaneous_actions)

    if not action_batches:
        # No actions possible, advance time
        result = sss_function(zones, drivers, max_depth, depth + 1,
                              cost, time + timedelta(minutes=10), visited_states.copy(), max_simultaneous_actions)
        return result

    for action_batch in action_batches:
        # Apply all actions in the batch to create new state
        new_drivers = copy.deepcopy(drivers)

        # Apply each action in the batch
        for action in action_batch.actions:
            for new_driver in new_drivers:
                if new_driver.earner_id == action.driver_id:
                    new_driver.destination_zone = action.to_zone
                    break

        # Recursive call with the new state
        recursive_score, recursive_cost, recursive_batches = sss_function(
            zones, new_drivers, max_depth, depth + 1,
            action_batch.total_cost, time + timedelta(minutes=10), visited_states.copy(), max_simultaneous_actions)

        total_cost = action_batch.total_cost + recursive_cost

        # Subtract cost from score to balance exploration vs exploitation
        adjusted_score = recursive_score - total_cost / 3600  # Cost factor can be tuned

        if len(action_batch.actions) > 0:  # Only log for non-empty batches
            logger.info(
                f"Batch with {len(action_batch.actions)} actions: score={recursive_score}, cost={total_cost / 3600:.2f}")

        if adjusted_score > best_score or (adjusted_score == best_score and total_cost < best_cost):
            best_score = adjusted_score
            best_cost = total_cost
            best_action_batches = [action_batch] + recursive_batches

    return best_score, best_cost, best_action_batches


@router.post("/state-space-search")
async def state_space_search(city_id: int, max_depth: int, custom_time: datetime = None, max_simultaneous_actions: int = 3):
    logger.info(
        f"Received state space search request for city_id={city_id}, max_depth={max_depth}")

    city = await Cities.filter(city_id=city_id).first()
    if not city:
        return {"error": "City not found"}

    logger.info(
        f"Starting state space search in city {city.name} with max depth {max_depth}")

    zones = city.zones

    densities_initialized = city.zone_densities

    # Initialize zone density cache at the start of SSS request
    initialize_zone_density_cache(densities_initialized, True)

    # Pre-compute zone centroids for performance optimization
    precompute_zone_centroids(zones)

    drivers = await Earners.filter(home_city_id=city_id, earner_type="driver").all()

    cost = 0

    global progress_counter
    progress_counter = 0

    # current time of day
    time = datetime.now()

    driver_count = 0
    for driver in drivers[:10]:
        if driver.status == "online" and driver.destination_zone is None:
            driver_count += 1
        if driver.latitude == 0 or driver.longitude == 0:
            # get random location within a random zone
            random_zone = random.choice(list(zones))
            random_shape = random.choice(random_zone)
            random_point = Polygon(random_shape["shell"]).centroid
            driver.latitude = random_point.y
            driver.longitude = random_point.x

            # update driver location in db
            await Earners.filter(earner_id=driver.earner_id).update(
                latitude=driver.latitude, longitude=driver.longitude)

    logger.info(f"Driver count: {driver_count}")

    logger.info(f"Starting SSS at time: {time}")

    if custom_time:
        time = custom_time
        logger.info(f"Using custom time: {time}")

    # Update driver states from trips before starting SSS
    trip_update_result = await update_driver_states_from_trips(time)
    logger.info(f"Trip update result: {trip_update_result}")

    # Pre-compute zone-to-zone travel times for performance optimization
    logger.info("Pre-computing zone distances...")
    precompute_zone_distances(zones, time)

    score, cost, optimal_action_batches = sss_function(
        zones, copy.deepcopy(drivers[:10]), max_depth, 0, cost, time, None, max_simultaneous_actions)

    # Convert action batches to serializable format
    batches_data = []
    all_actions = []

    for batch in optimal_action_batches:
        batch_actions = []
        for action in batch.actions:
            action_data = {
                "driver_id": action.driver_id,
                "from_zone": action.from_zone,
                "to_zone": action.to_zone,
                "cost": action.cost,
                "time": action.time.isoformat()
            }
            batch_actions.append(action_data)
            all_actions.append(action)

        batches_data.append({
            "time_step": batch.time.isoformat(),
            "actions": batch_actions,
            "batch_cost": batch.total_cost,
            "action_count": len(batch_actions)
        })

    # Calculate metrics for RL training
    total_travel_cost = sum(action.cost for action in all_actions)
    unique_drivers = len(set(action.driver_id for action in all_actions))
    total_actions = len(all_actions)

    return {
        "message": "State space search completed",
        "cost": cost,
        "score": score,
        "optimal_action_batches": batches_data,
        "total_time_steps": len(batches_data),
        "total_actions": total_actions,
        "total_travel_cost": total_travel_cost,
        "unique_drivers_moved": unique_drivers,
        "avg_cost_per_action": total_travel_cost / total_actions if total_actions > 0 else 0,
        "avg_actions_per_time_step": total_actions / len(batches_data) if batches_data else 0,
        "search_depth": max_depth,
        "explored_states": progress_counter
    }
