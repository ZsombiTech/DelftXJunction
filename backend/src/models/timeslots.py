from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class Timeslots(Model):
    timeslot_id = fields.IntField(pk=True)
    user_id = fields.IntField()
    earner_id = fields.TextField(null=True)
    start_time = fields.DatetimeField(auto_now_add=True)
    end_time = fields.DatetimeField(null=True)
    is_active = fields.BooleanField(default=True)

    class Meta:
        app = "models"
        table = "timeslots"

    def __str__(self):
        return f"Timeslot {self.timeslot_id} - User {self.user_id}"


TimeslotSchema = pydantic_model_creator(Timeslots)
