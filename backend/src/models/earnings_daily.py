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
    rides_duration_mins = fields.IntField(null=True)
    rides_gross_fare = fields.FloatField(null=True)
    rides_net_earnings = fields.FloatField(null=True)
    rides_tips = fields.FloatField(null=True)
    orders_count = fields.IntField(null=True)
    eats_distance_km = fields.FloatField(null=True)
    eats_duration_mins = fields.IntField(null=True)
    eats_delivery_fee = fields.FloatField(null=True)
    eats_net_earnings = fields.FloatField(null=True)
    eats_tips = fields.FloatField(null=True)
    total_jobs = fields.IntField(null=True)
    total_net_earnings= fields.FloatField(null=True)
    total_tips = fields.FloatField(null=True)
    week = fields.TextField(null=True)

    class Meta:
        app = "models"
        table = "earnings_daily"
        unique_together = (("earner_id", "city_id", "date"),)

EventSchema = pydantic_model_creator(EarningsDaily)