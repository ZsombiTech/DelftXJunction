from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class IncentivesWeekly(Model):
    earner_id = fields.ForeignKeyField(
        "models.Earners",
        related_name="incentives_weekly",
        null=False,
    )
    week = fields.TextField(null=False)
    program = fields.CharField(max_length=100, null=True)
    target_jobs = fields.IntField(null=True)
    completed_jobs = fields.IntField(null=True)
    achieved = fields.BooleanField(default=False)
    bonus_eur = fields.FloatField(null=True)

    class Meta:
        table = "incentives_weekly"
        unique_together = (("earner_id", "week"),)

    def __str__(self):
        return str(self.earner_id)
    

EventSchema = pydantic_model_creator(IncentivesWeekly)

