from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class SurgeByHour(Model):
    city_id = fields.ForeignKeyField(
        "models.Cities",
        related_name="surge_by_hour",
        null=False,
    )
    hour = fields.IntField(null=False)
    surge_multiplier = fields.FloatField(null=True)

    class Meta:
        table = "surge_by_hour"
        unique_together = (("city_id", "hour"),)

    def __str__(self):
        return f"{self.city_id} - {self.hour}"