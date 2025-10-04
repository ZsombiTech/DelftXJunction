from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator
from src.models.eats_orders import EatsOrders
from src.models.incentives_weekly import IncentivesWeekly
from src.models.users_earners import UsersEarners


class Earners(Model):
    earner_id = fields.TextField(pk=True)
    earner_type = fields.CharField(max_length=50)
    vehicle_type = fields.CharField(max_length=50, null=True)
    fuel_type = fields.CharField(max_length=50, null=True)
    is_ev = fields.BooleanField(default=False)
    experience_months = fields.IntField(null=True)
    rating = fields.FloatField(null=True)
    status = fields.CharField(max_length=20, default="active")
    longitude = fields.FloatField(null=True, default=0.0)
    latitude = fields.FloatField(null=True, default=0.0)
    destination_zone = fields.CharField(max_length=100, null=True)
    home_city = fields.ForeignKeyField(
        "models.Cities",
        related_name="earners",
        null=True
    )
    # Reverse relation to UsersEarners
    users: fields.ReverseRelation["UsersEarners"]

    # Reverse relation to EatsOrders
    eats_orders: fields.ReverseRelation["EatsOrders"]
    # Reverse relation to IncentivesWeekly
    incentives_weekly: fields.ReverseRelation["IncentivesWeekly"]

    class Meta:
        app = "models"
        table = "earners"

    def __str__(self):
        return str(self.earner_id)


EventSchema = pydantic_model_creator(Earners)
