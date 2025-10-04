from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class CancellationRates(Model):
    city_id = fields.ForeignKeyField(
        "models.Cities",
        related_name="cancellation_rates",
        null=False,
    )
    hexagon_id9 = fields.CharField(max_length=50, null=True)
    job_count = fields.IntField(null=True)

    cancellation_rate_pct = fields.FloatField(null=True)

    class Meta:
        table = "cancellation_rates"
        unique_together = (("city_id", "hexagon_id9"),)

    def __str__(self):
        return f"{self.city_id} - {self.hour}"
