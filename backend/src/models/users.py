from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

from src.models.users_earners import UsersEarners


class Users(Model):
    user_id = fields.IntField(pk=True)
    email = fields.CharField(max_length=100, unique=True)
    password = fields.CharField(max_length=128)
    firstname = fields.CharField(max_length=30, null=True)
    lastname = fields.CharField(max_length=30, null=True)

    earners: fields.ReverseRelation["UsersEarners"]

    class Meta:
        app = "models"
        table = "users"

    def __str__(self):
        return self.email


EventSchema = pydantic_model_creator(Users)
