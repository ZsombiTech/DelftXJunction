from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator
from src.models.eats_orders import EatsOrders

class Merchants(Model):
    merchant_id = fields.TextField(pk=True)
    lat = fields.FloatField(null=True)
    lng = fields.FloatField(null=True)
    hex_id9 = fields.CharField(max_length=9, null=True)
    city_id = fields.ForeignKeyField(
        "models.Cities",
        related_name="merchants",
        null=True
    )
    eats_orders: fields.ReverseRelation["EatsOrders"]  # Reverse relation to EatsOrders

    class Meta:
        table = "merchants"

    def __str__(self):
        return str(self.earner_id)
    

EventSchema = pydantic_model_creator(Merchants)

