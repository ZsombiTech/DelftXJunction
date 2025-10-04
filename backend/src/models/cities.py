from tortoise import fields
from tortoise.contrib.pydantic import pydantic_model_creator
from .earners import Earners
from tortoise.models import Model

class Cities(Model):
    city_id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100)
    earners: fields.ReverseRelation["Earners"]  # Reverse relation to Earners

    class Meta:
        table = "cities"

    def __str__(self):
        return self.name

EventSchema = pydantic_model_creator(Cities)