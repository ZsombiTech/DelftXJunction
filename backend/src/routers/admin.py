from fastapi import APIRouter, HTTPException, status, Depends
from datetime import UTC, timedelta, datetime
import orjson as json

from pydantic import BaseModel
from src.models.jobs_like import JobsLike
from src.ml.data import ZoneFormat, cut_zone_with_others, get_zone, point_near_zone
from src.models.cities import Cities
from src.schemas.auth import UserRegister, UserLogin, ForgotPassword, Token, RegisterResponse, LoginResponse
from src.models.users import Users

router = APIRouter(prefix="/admin", tags=["admin"])


def reprint(something):
    print("\033[F", end="")
    print(something)

def generate_zones(pickup_points: list[JobsLike], seconds: int, min_interval_minutes: int):
    zones: list[ZoneFormat] = []
    densities: list[dict[str, int | list[tuple[float, float]]]] = [] 

    def add_pickup(time: datetime, zone_index: int):
        for i, density in enumerate(densities):
            start = datetime.fromtimestamp(density["time"], tz=UTC)
            if start <= time and time < start + timedelta(minutes=min_interval_minutes):
                if len(densities[i]["pickups"]) <= zone_index:
                    densities[i]["pickups"].extend([0] * (zone_index + 1 - len(densities[i]["pickups"])))
                densities[i]["pickups"][zone_index] += 1
                return

        time_minutes = int(time.timestamp()) // 60
        interval_start_minutes = (time_minutes // min_interval_minutes) * min_interval_minutes
        new_interval_time = datetime.fromtimestamp(interval_start_minutes * 60, tz=UTC)
        densities.append({ "time": int(new_interval_time.timestamp()), "pickups": [0] * zone_index + [1] })

    print() # Empty line

    for i, pickup_point in enumerate(pickup_points):
        reprint(i)
        point = (pickup_point.begin_checkpoint_actual_location_latitude, pickup_point.begin_checkpoint_actual_location_longitude)

        near_zone_index = -1
        for j, zone in enumerate(zones):
            reprint(f"{i} ({j}, {len(zone[0]["shell"])})")
            if point_near_zone(point, zone):
                near_zone_index = j
                break
        if near_zone_index != -1:
            add_pickup(pickup_point.begin_checkpoint_ata_utc, near_zone_index)
            continue
        
        reprint(f"{i} ...       ")
        new_zone = get_zone(point[0], point[1], seconds)
        new_zone = cut_zone_with_others(new_zone, zones)
        
        if len(new_zone) > 0:
            zones.append(new_zone)
            if len(densities) == 0:
                densities.append({ "time": int(pickup_point.begin_checkpoint_ata_utc.timestamp()), "pickups": [0] * (len(zones) - 1) + [1] })
            else:
                add_pickup(pickup_point.begin_checkpoint_ata_utc, len(zones) - 1)

    
    return zones, densities



class UpdateCityZonesRequest(BaseModel):
    seconds: int = 360 # 6 minutes
    min_interval_minutes: int = 30

@router.post("/update_city_zones", status_code=status.HTTP_201_CREATED)
async def update_city_zones(request: UpdateCityZonesRequest):
    all_cities = await Cities.all()
    print(f"Updating all cities with {request.seconds}-second radius")
    for city in all_cities:
        print(f"Updating zones for {city.name}...")

        all_pickup_points = await city.jobs_like_begin.all()
        print(f"{len(all_pickup_points)} pickup points")
        zones, densities = generate_zones(all_pickup_points, request.seconds, request.min_interval_minutes)
        city.zones = json.dumps(zones)
        city.zone_densities = json.dumps(densities)
        await city.save()


    return "City zones updated suhhcessfully 🥀"
