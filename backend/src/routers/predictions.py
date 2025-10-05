import copy
import sys
import hashlib
import json
from src.ml.data import get_travel_time, point_near_zone
from src.ml.zone_density_cache import get_current_zone_densities, initialize_zone_density_cache, get_zone_densities_for_time
from src.utils.logger import logger
from fastapi import APIRouter
from src.models import Cities, Earners
from datetime import datetime, timedelta
from shapely.geometry import Polygon, MultiPolygon
import random

router = APIRouter(prefix="/predictions", tags=["predictions"])

progress_counter = 0


def eval_state(zones, drivers, time, timeframe_count: int = 3) -> float:
    # Timeframe count is how many 10-minute intervals to look ahead for density
    # (default 3 = 30 minutes)
    score = 0
    drivers_in_zones = [0 for _ in range(len(zones))]
    for driver in drivers:
        if driver.status == "online" and driver.destination_zone is None:
            # Driver is idle, count them in the zone

            # Get drivers zone from location
            for index, zone in enumerate(zones):
                if point_near_zone([driver.latitude, driver.longitude], zone, 0.01):
                    current_driver_zone = index
                    break

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
            score += driver_count
        elif driver_count > current_zone_density:
            score += driver_count
            if driver_count > 1.3 * current_zone_density:
                score -= (driver_count - 1.3 * current_zone_density)
        else:  # driver_count < current_zone_density
            score -= (current_zone_density - driver_count)

    # logger.info(f"Evaluated state at time {time}, score: {score}")
    return score


def get_state_hash(drivers, time):
    """Generate a hash representation of the current driver state"""
    state_data = []
    for driver in drivers:
        # logger.info(
        #     f"Driver {driver.earner_id}:")
        state_data.append({
            'id': driver.earner_id,
            'status': driver.status,
            'destination_zone': getattr(driver, 'destination_zone', None)
        })

    # Sort by driver ID for consistent hashing
    state_data.sort(key=lambda x: x['id'])
    state_str = json.dumps(state_data, sort_keys=True)
    state_str += f":{time}"
    return hashlib.md5(state_str.encode()).hexdigest()


def sss_function(zones, drivers, max_depth, depth, cost, time, visited_states=None):
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
        return -sys.maxsize - 1, 0  # Return worst score for revisited states

    visited_states.add(state_hash)

    if depth == max_depth:
        # logger.info(f"Reached max depth {max_depth}, evaluating state")
        current_time = datetime.now()
        score = eval_state(zones, drivers, current_time)
        return score, cost

    best_score = -sys.maxsize - 1
    best_cost = sys.maxsize

    # Calculate possible actions
    possible_actions = []

    for driver in drivers:
        if driver.status == "online" and driver.destination_zone is None:
            for index, zone in enumerate(zones):
                possible_actions.append([driver, index])

    if not possible_actions:
        return sss_function(zones, drivers, max_depth, depth + 1, cost, time + timedelta(minutes=10), visited_states.copy())

    for action in possible_actions:
        driver, target_zone_id = action

        # Create new state by copying and modifying
        new_drivers = copy.deepcopy(drivers)
        for driver in new_drivers:
            if driver.earner_id == driver:
                driver.destination_zone = target_zone_id
                break

        # Create multypolygon from zone shapes
        zone_shapes = [Polygon(shape["shell"], holes=shape["holes"])
                       for shape in zones[target_zone_id]]
        zone_multipolygon = MultiPolygon(zone_shapes)

        new_cost = get_travel_time([driver.latitude, driver.longitude],
                                   [zone_multipolygon.centroid.y, zone_multipolygon.centroid.x], time)

        # Recursive call with copied state and visited states
        recursive_score, recursive_cost = sss_function(
            zones, new_drivers, max_depth, depth + 1, new_cost, time + timedelta(minutes=10), visited_states.copy())

        total_cost = new_cost + recursive_cost

        # Subtract cost from score to balance exploration vs exploitation
        adjusted_score = recursive_score - total_cost  # Cost factor can be tuned

        if adjusted_score > best_score or (adjusted_score == best_score and total_cost < best_cost):
            best_score = adjusted_score
            best_cost = total_cost

    return best_score, best_cost


@router.post("/state-space-search")
async def state_space_search(city_id: int, max_depth: int, custom_time: datetime = None):
    logger.info(
        f"Received state space search request for city_id={city_id}, max_depth={max_depth}")

    city = await Cities.filter(city_id=city_id).first()
    if not city:
        return {"error": "City not found"}

    logger.info(
        f"Starting state space search in city {city.name} with max depth {max_depth}")

    # Perform state space search using city and depth
    zones = city.zones

    densities_initialized = city.zone_densities

    # Initialize zone density cache at the start of SSS request
    initialize_zone_density_cache(densities_initialized, True)

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

    cost, score = sss_function(
        zones, copy.deepcopy(drivers[:10]), max_depth, 0, cost, time)

    return {"message": "State space search completed", "cost": cost, "score": score}
