from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class Riders(Model):
    rider_id = fields.TextField(pk=True)
    trip_frequency = fields.CharField(max_length=50, null=True)
    preferred_product = fields.CharField(max_length=100, null=True)
    payment_type = fields.CharField(max_length=50, null=True)

    class Meta:
        table = "riders"

    def __str__(self):
        return str(self.rider_id)
    

EventSchema = pydantic_model_creator(Riders)