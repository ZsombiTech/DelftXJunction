from datetime import datetime, timedelta
from shapely import GeometryCollection, MultiPolygon
from src.utils.logger import logger
import traveltimepy as tt
from traveltimepy.requests.common import Coordinates, Location
from traveltimepy.requests.time_filter import TimeFilterDepartureSearch, Driving
from traveltimepy.responses.time_map import Shape
import os
import json
from dotenv import load_dotenv
from shapely.geometry import Point, Polygon

load_dotenv(os.path.join(os.getcwd(), ".env"))

app_id = os.getenv("TRAVELTIME_APP_ID")
api_key = os.getenv("TRAVELTIME_API_KEY")

client = tt.Client(app_id, api_key)

# Cache management
CACHE_FILE = "travelCache.json"


def load_travel_cache():
    try:
        with open(CACHE_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_travel_cache(cache):
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2)


travel_cache = load_travel_cache()

# Geographical boundary
CoordinatePolygon = list[tuple[float, float]]

# A zone can consist of multiple polygons (due to fragmentation), so it's a list
ZoneFormat = list[dict[  # dict for "shell" and "holes"
    str, (
        CoordinatePolygon  # type of "shell" (polygon)
        | list[CoordinatePolygon]  # type of "holes" (list of polygons)
    )
]]


def format_shapes(shapes: list[Shape]) -> ZoneFormat:
    return [
        {
            "shell": [(coord.lng, coord.lat) for coord in shape.shell],
            "holes": [[(coord.lng, coord.lat) for coord in hole] for hole in shape.holes]
        } for shape in shapes
    ]


def point_in_zone(point, zone: ZoneFormat):
    point_geom = Point(point[1], point[0])  # lng, lat for Shapely

    for shape in zone:
        polygon = Polygon(shape["shell"], holes=shape["holes"])
        if polygon.contains(point_geom):
            return True

    return False

# Check if a point is inside or within a certain distance of a zone
def point_near_zone(point, zone: ZoneFormat, distance: float = 0.0005):
    point_geom = Point(point[1], point[0])  # lng, lat for Shapely
    for shape in zone:
        polygon = Polygon(shape["shell"], holes=shape["holes"])
        if polygon.contains(point_geom) or polygon.distance(point_geom) < distance:
            return True
    return False


def cut_zone_with_others(zone: ZoneFormat, others: list[ZoneFormat]):
    # Cut others from each shape
    for i, shape in enumerate(zone):
        polygon = Polygon(shape["shell"], holes=shape["holes"])
        for other in others:  # Each outer zone
            for other_shape in other:  # Each shape in the outer zone
                other_polygon = Polygon(
                    other_shape["shell"], holes=other_shape["holes"])
                polygon: Polygon | MultiPolygon = polygon.difference(
                    other_polygon)

        # Remove polygon if it's empty
        if polygon.is_empty:
            zone.pop(i)
            continue

        # If polygon is a GeometryCollection, append it to the zone
        if polygon.geom_type == "GeometryCollection":
            polygon = MultiPolygon(
                [geom for geom in polygon.geoms if geom.geom_type == "Polygon"])
            continue

        # minds in motion motto connection idea

        # In case of MultiPolygon, extract bodies and append them to the zone
        if polygon.geom_type == "MultiPolygon":
            zone.pop(i)

            for body in polygon.geoms:
                if body.geom_type == "GeometryCollection":
                    print(body)
                    continue
                zone.append({
                    "shell": list(body.exterior.coords),
                    "holes": [list(hole.coords) for hole in body.interiors]
                })
            continue

        # If polygon, convert back to ZoneFormat
        if polygon.geom_type == "Polygon":
            zone[i] = {
                "shell": list(polygon.exterior.coords),
                "holes": [list(hole.coords) for hole in polygon.interiors]
            }
            continue

        # Else, drop it
        zone.pop(i)

    return zone


def cut_poly_with_others(poly: Polygon, others: MultiPolygon):
    for other in others:
        poly = poly.difference(other)

    if poly.geom_type == "GeometryCollection":
        poly = MultiPolygon(
            [geom for geom in poly.geoms if geom.geom_type == "Polygon"])

    if poly.geom_type == "MultiPolygon":
        poly: MultiPolygon = poly
        return poly

    if poly.geom_type == "Polygon":
        return MultiPolygon([poly])

    return None


def get_zone(lat, lng, seconds):
    response = client.time_map_fast(
        arrival_searches={
            "one_to_many": [
                {
                    "id": "1",
                    "coords": {
                        "lat": lat,
                        "lng": lng
                    },
                    "arrival_time": datetime.now() + timedelta(seconds=seconds),
                    "travel_time": seconds,
                    "transportation": "cycling",
                    "level_of_detail": {
                        "scale_type": {
                            "level": "lowest"
                        }
                    }
                }
            ],
            "many_to_one": []
        }
    )

    zone = format_shapes(response.results[0].shapes)

    # Remove holes
    for i in range(len(zone)):
        zone[i]["holes"] = []

    # for i in range(len(zone)):
    #     zone[i]["shell"] = list(Polygon(zone[i]["shell"]).simplify(0.0005).exterior.coords)

    return zone


def get_travel_time(origin, destination, start_time):
    # Create cache key with rounded coordinates to improve cache hit rate
    cache_key = f"{round(origin[0], 6)},{round(origin[1], 6)}-{round(destination[0], 6)},{round(destination[1], 6)}"

    # Check cache first
    if cache_key in travel_cache:
        logger.info(f"Cache hit for {cache_key}")
        return travel_cache[cache_key]

    logger.info(f"Cache miss for {cache_key}, making API call")

    response = client.time_filter(
        locations=[
            Location(
                id="origin",
                coords=Coordinates(lat=origin[0], lng=origin[1])
            ),
            Location(
                id="destination",
                coords=Coordinates(lat=destination[0], lng=destination[1])
            )
        ],
        departure_searches=[
            TimeFilterDepartureSearch(
                id="1",
                departure_location_id="origin",
                arrival_location_ids=["destination"],
                travel_time=3600,  # 1 hour max travel time in seconds
                departure_time=datetime.now() + timedelta(seconds=start_time),
                transportation=Driving(),
                properties=["travel_time"]
            )
        ],
        arrival_searches=[]
    )

    logger.info(f"Travel time response: {response}")

    if response.results and response.results[0].locations:
        travel_time = response.results[0].locations[0].properties[0].travel_time
        logger.info(f"Travel time: {travel_time} seconds")

        # Cache the result
        travel_cache[cache_key] = travel_time
        save_travel_cache(travel_cache)

        return travel_time
    else:
        logger.warning("No travel time found")
        default_time = 360000  # Return max travel time if no result

        # Cache the default result to avoid repeated failed API calls
        travel_cache[cache_key] = default_time
        save_travel_cache(travel_cache)

        return default_time


def test():
    zone = get_zone(51.924413, 4.477738, 360)

    # Test coordinates
    # coord in range: 51.922519, 4.479310
    # coord out of range: 51.916193, 4.466101

    test_point_origin = (51.924413, 4.477738)  # lat, lng
    test_point_in = (51.922519, 4.479310)  # lat, lng
    test_point_out = (51.916193, 4.466101)  # lat, lng

    # Test with Shapely (will show message if not installed)
    print(
        f"Point {test_point_origin} in area: {point_in_zone(test_point_origin, zone)}")
    print(f"Point {test_point_in} in area: {point_in_zone(test_point_in, zone)}")
    print(
        f"Point {test_point_out} in area: {point_in_zone(test_point_out, zone)}")
