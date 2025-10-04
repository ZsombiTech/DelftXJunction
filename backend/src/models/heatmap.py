from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class Heatmap(Model):
    hexagon_id_9 = fields.CharField(max_length=50)
    city_id = fields.ForeignKeyField(
        "models.Cities",
        related_name="heatmaps",
        null=False
    )
    map_id = fields.CharField(max_length=50, null=True)
    currency_code = fields.CharField(max_length=10, null=True)
    earnings_heatmap_type = fields.CharField(max_length=50, null=True)
    predicted_eph = fields.FloatField(null=True)
    predicted_std = fields.FloatField(null=True)
    in_final_heatmap = fields.BooleanField(default=False)

    class Meta:
        table = "heatmap"
        unique_together = (("hexagon_id_9", "city_id"),)

    def __str__(self):
        return self.hexagon_id_9