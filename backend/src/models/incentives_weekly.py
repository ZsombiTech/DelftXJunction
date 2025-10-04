from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class IncentivesWeekly(Model):
    earner = fields.ForeignKeyField(
        "models.Earners",
        related_name="incentives_weekly",
        null=False,
        db_column="earner_id",
    )
    week = fields.TextField(null=False)
    program = fields.CharField(max_length=100, null=True)
    target_jobs = fields.IntField(null=True)
    completed_jobs = fields.IntField(null=True)
    achieved = fields.BooleanField(default=False)
    bonus_eur = fields.FloatField(null=True)

    class Meta:
        app = "models"
        table = "incentives_weekly"
        unique_together = (("earner_id", "week"),)
    

EventSchema = pydantic_model_creator(IncentivesWeekly)

