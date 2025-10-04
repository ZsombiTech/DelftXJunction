import copy
import sys
from fastapi import APIRouter
from src.models import Cities, Earners
from datetime import datetime, timedelta

router = APIRouter(prefix="/predictions", tags=["predictions"])


def eval_state(zones, drivers):
    # Placeholder for state evaluation logic
    return 0


def sss_function(zones, drivers, depth, cost, time_of_day):
    score = -sys.maxsize - 1  # lowest possible integer

    # Calculate possible actions
    # Aka, possible zones for the idle drivers to go to
    possible_actions = set()
    for driver in drivers:
        if driver.status == "online" and driver.destination_zone is None:
            for i, zone in enumerate(zones):
                if zone != driver.destination_zone:
                    possible_actions.add((driver.earner_id, zone))

    return score, cost


@router.post("/state-space-search")
async def state_space_search(cityId: int, depth: int):
    city = Cities.get(cityId)
    if not city:
        return {"error": "City not found"}
    # Perform state space search using city and depth
    zones = city.zones

    drivers = await Earners.filter(home_city_id=cityId, earner_type="driver").all()

    cost = 0

    # current time of day
    time_of_day = datetime.now().hour * 3600 + datetime.now().minute * \
        60 + datetime.now().second

    cost, score = sss_function(
        zones, copy.deepcopy(drivers), depth, cost, time_of_day)

    return {"message": "State space search completed", "cityId": cityId, "depth": depth}
