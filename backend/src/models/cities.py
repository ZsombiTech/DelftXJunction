from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator
from src.models.earners import Earners
from src.models.merchants import Merchants
from src.models.weather_daily import WeatherDaily
from src.models.eats_orders import EatsOrders
from src.models.heatmap import Heatmap
from src.models.jobs_like import JobsLike
from src.models.rides_trips import RidesTrips
from src.models.cancellation_rates import CancellationRates

class Cities(Model):
    city_id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100)
    earners: fields.ReverseRelation["Earners"]  # Reverse relation to Earners
    merchants: fields.ReverseRelation["Merchants"]  # Reverse relation to Merchants
    weather: fields.ReverseRelation["WeatherDaily"]  # Reverse relation to WeatherDaily
    eats_orders: fields.ReverseRelation["EatsOrders"]  # Reverse relation to EatsOrders
    heatmaps: fields.ReverseRelation["Heatmap"]  # Reverse relation to Heatmap
    jobs_like_begin: fields.ReverseRelation["JobsLike"]  # Reverse relation to JobLike (begin)
    jobs_like_end: fields.ReverseRelation["JobsLike"]  # Reverse relation to Job
    rides_trips: fields.ReverseRelation["RidesTrips"]  # Reverse relation to RidesTrips
    cancellation_rates: fields.ReverseRelation["CancellationRates"]  # Reverse relation to CancellationRates
    class Meta:
        table = "cities"

    def __str__(self):
        return self.name

EventSchema = pydantic_model_creator(Cities)