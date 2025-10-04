from datetime import datetime, timedelta
import traveltimepy as tt
from traveltimepy.requests.common import Coordinates
from traveltimepy.responses.time_map import Shape
import os
from dotenv import load_dotenv
from shapely.geometry import Point, Polygon

load_dotenv(os.path.join(os.getcwd(), ".env"))

app_id = os.getenv("TRAVELTIME_APP_ID")
api_key = os.getenv("TRAVELTIME_API_KEY")

client = tt.Client(app_id, api_key)

# Geographical boundary
CoordinatePolygon = list[tuple[float, float]]

# A zone can consist of multiple polygons (due to fragmentation), so it's a list
ZoneFormat = list[dict[ # dict for "shell" and "holes"
    str, (
        CoordinatePolygon # type of "shell" (polygon)
        | list[CoordinatePolygon] # type of "holes" (list of polygons)
    )
]]

def format_shapes(shapes: list[Shape]) -> ZoneFormat:
    return [
        {
            "shell": [(coord.lng, coord.lat) for coord in shape.shell],
            "holes": [[(coord.lng, coord.lat) for coord in hole] for hole in shape.holes]
        } for shape in shapes
    ]

def point_in_zone(point, area: ZoneFormat):
    point_geom = Point(point[1], point[0])  # lng, lat for Shapely

    for shape in area:
        # Create main polygon from shell
        polygon = Polygon(shape["shell"])

        # Cut out holes if they exist
        if shape["holes"]:
            polygon = Polygon(shape["shell"], holes=shape["holes"])

        if polygon.contains(point_geom):
            return True

    return False


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
                    "transportation": "driving",
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

    return format_shapes(response.results[0].shapes)

def test():
    zone = get_zone(51.924413, 4.477738, 360)

    # Test coordinates
    # coord in range: 51.922519, 4.479310
    # coord out of range: 51.916193, 4.466101

    test_point_origin = (51.924413, 4.477738)  # lat, lng
    test_point_in = (51.922519, 4.479310)  # lat, lng
    test_point_out = (51.916193, 4.466101)  # lat, lng

    # Test with Shapely (will show message if not installed)
    print(f"Point {test_point_origin} in area: {point_in_zone(test_point_origin, zone)}")
    print(f"Point {test_point_in} in area: {point_in_zone(test_point_in, zone)}")
    print(f"Point {test_point_out} in area: {point_in_zone(test_point_out, zone)}")
