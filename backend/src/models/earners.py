from tortoise.models import Model
from tortoise import fields

class Earners(Model):
    earner_id = fields.IntField(pk=True)
    earner_type = fields.CharField(max_length=50)
    vehicle_type = fields.CharField(max_length=50, null=True)
    fuel_type = fields.CharField(max_length=50, null=True)
    is_ev = fields.BooleanField(default=False)
    experience_months = fields.IntField(null=True)
    rating = fields.FloatField(null=True)
    status = fields.CharField(max_length=20, default="active")
    home_city = fields.CharField(max_length=100, null=True)