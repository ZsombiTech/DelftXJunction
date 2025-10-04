from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator
from src.models.earners import Earners
from src.models.merchants import Merchants
from src.models.weather_daily import WeatherDaily
from src.models.eats_orders import EatsOrders

class Cities(Model):
    city_id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100)
    earners: fields.ReverseRelation["Earners"]  # Reverse relation to Earners
    merchants: fields.ReverseRelation["Merchants"]  # Reverse relation to Merchants
    weather: fields.ReverseRelation["WeatherDaily"]  # Reverse relation to WeatherDaily
    eats_orders: fields.ReverseRelation["EatsOrders"]  # Reverse relation to EatsOrders

    class Meta:
        table = "cities"

    def __str__(self):
        return self.name

EventSchema = pydantic_model_creator(Cities)