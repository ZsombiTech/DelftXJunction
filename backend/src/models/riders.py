from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator

class Riders(Model):
    rider_id = fields.TextField(pk=True)

    class Meta:
        table = "riders"

    def __str__(self):
        return str(self.rider_id)
    

EventSchema = pydantic_model_creator(Riders)