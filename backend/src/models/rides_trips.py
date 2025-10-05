from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class RidesTrips(Model):
    ride_id = fields.TextField(pk=True)
    driver = fields.ForeignKeyField(
        "models.Earners",
        related_name="rides_trips",
        null=False,
        column_name="driver_id",
    )
    rider = fields.ForeignKeyField(
        "models.Riders",
        related_name="rides_trips",
        null=False,
        column_name="rider_id",
    )
    city = fields.ForeignKeyField(
        "models.Cities",
        related_name="rides_trips",
        null=True,
        column_name="city_id",
    )
    product = fields.CharField(max_length=100, null=True)
    vehicle_type = fields.CharField(max_length=50, null=True)
    is_ev = fields.BooleanField(default=False)
    start_time = fields.DatetimeField(null=True)
    end_time = fields.DatetimeField(null=True)
    pickup_lat = fields.FloatField(null=True)
    pickup_lon = fields.FloatField(null=True)
    pickup_hex_id9 = fields.CharField(max_length=50, null=True)
    drop_lat = fields.FloatField(null=True)
    drop_lon = fields.FloatField(null=True)
    drop_hex_id9 = fields.CharField(max_length=50, null=True)
    distance_km = fields.FloatField(null=True)
    duration_mins = fields.FloatField(null=True)
    surge_multiplier = fields.FloatField(null=True)
    fare_amount = fields.FloatField(null=True)
    uber_fee = fields.FloatField(null=True)
    net_earnings = fields.FloatField(null=True)
    tips = fields.FloatField(null=True)
    payment_type = fields.CharField(max_length=50, null=True)
    date = fields.DateField(null=True)

    class Meta:
        app = "models"
        table = "rides_trips"

RidesTripsSchema = pydantic_model_creator(RidesTrips)
