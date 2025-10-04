from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator
from tortoise.models import Model

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

    class Meta:
        table = "earners"

    def __str__(self):
        return str(self.earner_id)
    

EventSchema = pydantic_model_creator(Earners)

