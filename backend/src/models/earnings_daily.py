from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class EarningsDaily(Model):
    earner_id = fields.ForeignKeyField(
        "models.Earners",
        related_name="earnings_daily",
        null=True
    )
    date = fields.TextField()
    city_id = fields.ForeignKeyField(
        "models.Cities",
        related_name="earnings_daily",
        null=True
    )
    trips_count = fields.IntField(null=True)
    rides_distance_km = fields.FloatField(null=True)
    rides_duration_min = fields.IntField(null=True)
    