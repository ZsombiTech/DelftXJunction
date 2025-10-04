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
    home_city = fields.ForeignKeyField(
        "models.Cities",
        related_name="earners",
        null=True
    )
    users: fields.ReverseRelation["UsersEarners"]  # Reverse relation to UsersEarners

    eats_orders: fields.ReverseRelation["EatsOrders"]  # Reverse relation to EatsOrders
    incentives_weekly: fields.ReverseRelation["IncentivesWeekly"]  # Reverse relation to IncentivesWeekly

    class Meta:
        app = "models"
        table = "earners"

    def __str__(self):
        return str(self.earner_id)
    

EventSchema = pydantic_model_creator(Earners)

