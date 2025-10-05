from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator



class UsersEarners(Model):
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField(
        "models.Users",
        related_name="users_earners_user",
        null=False,
        on_delete=fields.CASCADE,
    )
    earner = fields.ForeignKeyField(
        "models.Earners",
        related_name="users_earners_earner",
        null=False,
        on_delete=fields.CASCADE,
    )

    class Meta:
        app = "models"
        table = "users_earners"
        unique_together = (("user", "earner"),)


EventSchema = pydantic_model_creator(UsersEarners)
