from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class UsersEarners(Model):
    user = fields.ForeignKeyField(
        "models.Users",
        related_name="earners",
        null=False,
        pk=True
    )
    earner = fields.ForeignKeyField(
        "models.Earners",
        related_name="users",
        null=False,
        unique=True,
    )

    class Meta:
        app = "models"
        table = "users_earners"
    
EventSchema = pydantic_model_creator(UsersEarners)
