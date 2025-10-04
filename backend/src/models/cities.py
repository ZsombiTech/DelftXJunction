from tortoise.models import Model
from tortoise import fields

class Cities(Model):
    city_id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100)