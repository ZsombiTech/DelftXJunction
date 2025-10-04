from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class WeatherDaily(Model):
    date = fields.TextField(pk=True)
    city_id = fields.ForeignKeyField(
        "models.Cities",
        related_name="weather",
        null=True
    )
    weather = fields.CharField(max_length=100, null=True)

    class Meta:
        table = "weather_daily"

    def __str__(self):
        return self.name

EventSchema = pydantic_model_creator(WeatherDaily)