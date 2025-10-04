from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator
from src.models.eats_orders import EatsOrders

class Customers(Model):
    customer_id = fields.TextField(pk=True)
    order_frequency = fields.CharField(max_length=50, null=True)
    payment_type = fields.CharField(max_length=50, null=True)

    eats_orders: fields.ReverseRelation["EatsOrders"]  # Reverse relation to EatsOrders

    class Meta:
        table = "customers"

    def __str__(self):
        return str(self.customer_id)
    
EventSchema = pydantic_model_creator(Customers)