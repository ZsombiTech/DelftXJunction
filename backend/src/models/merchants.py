from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator
from src.models.eats_orders import EatsOrders

class Merchants(Model):
    merchant_id = fields.TextField(pk=True)
    lat = fields.FloatField(null=True)
    lon = fields.FloatField(null=True)
    hex_id9 = fields.CharField(max_length=9, null=True)
    # Use 'city' as the attribute name so Tortoise produces a single
    # 'city_id' DB column. The existing DB column is named 'city_id',
    # so set db_column explicitly to avoid creating 'city_id_id'.
    city = fields.ForeignKeyField(
        "models.Cities",
        related_name="merchants",
        null=True,
        db_column="city_id",
    )
    eats_orders: fields.ReverseRelation["EatsOrders"]  # Reverse relation to EatsOrders

    class Meta:
        app = "models"
        table = "merchants"

    def __str__(self):
        return str(self.merchant_id)
    

EventSchema = pydantic_model_creator(Merchants)

