from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class EatsOrders(Model):
    order_id = fields.TextField(pk=True)
    courier_id = fields.ForeignKeyField(
        "models.Earners",
        related_name="eats_orders",
        null=True
    )
    customer_id = fields.ForeignKeyField(
        "models.Customers",
        related_name="eats_orders",
        null=True
    )
    merchant_id = fields.ForeignKeyField(
        "models.Merchants",
        related_name="eats_orders",
        null=True
    )
    city_id = fields.ForeignKeyField(
        "models.Cities",
        related_name="eats_orders",
        null=True
    )
    vehicle_type = fields.CharField(max_length=50, null=True)
    is_ev = fields.BooleanField(default=False)
    start_time = fields.TimeField(null=True)
    end_time = fields.TimeField(null=True)
    pickup_lat = fields.FloatField(null=True)
    pickup_lng = fields.FloatField(null=True)
    pickup_hex_id9 = fields.CharField(max_length=9, null=True)
    drop_lat = fields.FloatField(null=True)
    drop_lng = fields.FloatField(null=True)
    drop_hex_id9 = fields.CharField(max_length=9, null=True)
    distance = fields.FloatField(null=True)
    duration_mins = fields.FloatField(null=True)
    basket_value_eur = fields.FloatField(null=True)
    delvery_fee_eur = fields.FloatField(null=True)
    tip_eur = fields.FloatField(null=True)
    net_earnings = fields.FloatField(null=True)
    payment_type = fields.CharField(max_length=50, null=True)
    date = fields.DateField(null=True)

    class Meta:
        app = "models"
        table = "eats_orders"

EventSchema = pydantic_model_creator(EatsOrders)