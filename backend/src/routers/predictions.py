import copy
import sys
import hashlib
import json
from src.utils.logger import logger
from fastapi import APIRouter
from src.models import Cities, Earners
from datetime import datetime, timedelta

router = APIRouter(prefix="/predictions", tags=["predictions"])

progress_counter = 0


def eval_state(zones, drivers):
    return 0


def get_state_hash(drivers):
    state_data = []
    for driver in drivers:
        state_data.append({
            'id': driver.earner_id,
            'status': driver.status,
            'destination_zone': getattr(driver, 'destination_zone', None)
        })

    state_data.sort(key=lambda x: x['id'])
    state_str = json.dumps(state_data, sort_keys=True)
    return hashlib.md5(state_str.encode()).hexdigest()


def sss_function(zones, drivers, max_depth, depth, cost, time_of_day, visited_states=None):
    global progress_counter
    progress_counter += 1
    logger.info(f"Progress: {progress_counter}, Depth: {depth}")
    if visited_states is None:
        visited_states = set()

    state_hash = get_state_hash(drivers)
    if state_hash in visited_states:
        return -sys.maxsize - 1, 0 

    visited_states.add(state_hash)

    if depth == max_depth:
        score = eval_state(zones, drivers)
        return score, cost

    best_score = -sys.maxsize - 1
    best_cost = cost

    possible_actions = []
    for driver in drivers:
        if driver.status == "online" and driver.destination_zone is None:
            for zone in zones:
                possible_actions.append([driver.earner_id, zone])

    if not possible_actions:
        return sss_function(zones, drivers, max_depth, depth + 1, cost, time_of_day, visited_states.copy())

    for action in possible_actions:
        driver_id, target_zone = action

        new_drivers = copy.deepcopy(drivers)
        for driver in new_drivers:
            if driver.earner_id == driver_id:
                driver.destination_zone = target_zone
                break

        new_cost = cost + 1

        new_score, recursive_cost = sss_function(
            zones, new_drivers, max_depth, depth + 1, new_cost, time_of_day, visited_states.copy())

        total_cost = new_cost + recursive_cost

        if new_score > best_score:
            best_score = new_score
            best_cost = total_cost

    return best_score, best_cost


@router.post("/state-space-search")
async def state_space_search(city_id: int, max_depth: int):
    logger.info(
        f"Received state space search request for city_id={city_id}, max_depth={max_depth}")
    city = await Cities.filter(city_id=city_id).first()
    if not city:
        return {"error": "City not found"}

    logger.info(
        f"Starting state space search in city {city.name} with max depth {max_depth}")
    
    zones = city.zones

    drivers = await Earners.filter(home_city_id=city_id, earner_type="driver").all()

    cost = 0

    global progress_counter
    progress_counter = 0

    time_of_day = datetime.now().hour * 3600 + datetime.now().minute * \
        60 + datetime.now().second

    cost, score = sss_function(
        zones, copy.deepcopy(drivers), max_depth, 0, cost, time_of_day)

    return {"message": "State space search completed", "cost": cost, "score": score}
