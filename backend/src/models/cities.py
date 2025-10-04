from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator
from Models import Earners

class Cities(Model):
    city_id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100)
    earners: fields.ReverseRelation["Earners"]  # Reverse relation to Earners

    class Meta:
        table = "cities"

    def __str__(self):
        return self.name

EventSchema = pydantic_model_creator(Cities)