from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
import orjson as json

from pydantic import BaseModel
from src.models.jobs_like import JobsLike
from src.ml.data import cut_zone_with_others, get_zone, point_in_zone
from src.models.cities import Cities
from src.schemas.auth import UserRegister, UserLogin, ForgotPassword, Token, RegisterResponse, LoginResponse
from src.models.users import Users

router = APIRouter(prefix="/admin", tags=["admin"])


class UpdateCityZonesRequest(BaseModel):
    seconds: int

def reprint(something):
    print("\033[F", end="")
    print(something)

def generate_zones(pickup_points: list[JobsLike], seconds: int):
    zones = []
    print() # Empty line

    for i, pickup_point in enumerate(pickup_points):
        reprint(i)
        point = (pickup_point.begin_checkpoint_actual_location_latitude, pickup_point.begin_checkpoint_actual_location_longitude)
        # Check if the point is in an existing zone
        should_continue = False
        for j, zone in enumerate(zones):
            reprint(f"{i} ({j}, {len(zone[0]["shell"])})")
            if point_in_zone(point, zone):
                should_continue = True
                break
        if should_continue:
            continue
        
        reprint(f"{i} ...       ")
        new_zone = get_zone(point[0], point[1], seconds)
        new_zone = cut_zone_with_others(new_zone, zones) # Cut existing zones out from the new one
        
        # If the zone has bodies, add it to the zones
        if len(new_zone) > 0:
            zones.append(new_zone)
    
    return zones


@router.post("/update_city_zones", status_code=status.HTTP_201_CREATED)
async def update_city_zones(request: UpdateCityZonesRequest):
    all_cities = await Cities.all()
    print(f"Updating all cities with {request.seconds}-second radius")
    for city in all_cities:
        print(f"Updating zones for {city.name}...")

        all_pickup_points = await city.jobs_like_begin.all()
        print(f"{len(all_pickup_points)} pickup points")
        zones = generate_zones(all_pickup_points, request.seconds)
        city.zones = json.dumps(zones)
        await city.save()


    return "City zones updated suhhcessfully 🥀"
