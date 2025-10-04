from datetime import datetime, timedelta
from shapely import GeometryCollection, MultiPolygon
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


def cut_zone_with_others(zone: ZoneFormat, others: list[ZoneFormat]):
    # Cut others from each shape
    for i, shape in enumerate(zone):
        polygon = Polygon(shape["shell"], holes=shape["holes"])
        for other in others: # Each outer zone
            for other_shape in other: # Each shape in the outer zone
                other_polygon = Polygon(other_shape["shell"], holes=other_shape["holes"])
                polygon: Polygon | MultiPolygon = polygon.difference(other_polygon)
        
        # Remove polygon if it's empty
        if polygon.is_empty:
            zone.pop(i)
            continue

        # If polygon is a GeometryCollection, append it to the zone
        if polygon.geom_type == "GeometryCollection":
            polygon = MultiPolygon([geom for geom in polygon.geoms if geom.geom_type == "Polygon"])
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
        poly = MultiPolygon([geom for geom in poly.geoms if geom.geom_type == "Polygon"])

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

    zone = format_shapes(response.results[0].shapes)

    # Remove holes
    for i in range(len(zone)):
        zone[i]["holes"] = []

    # for i in range(len(zone)):
    #     zone[i]["shell"] = list(Polygon(zone[i]["shell"]).simplify(0.0005).exterior.coords)

    return zone


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
