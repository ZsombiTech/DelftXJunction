from tortoise import fields, Model
from tortoise.contrib.pydantic import pydantic_model_creator

class JobsLike(Model):
    job_uuid = fields.CharField(max_length=100, pk=True)
    marketplace = fields.CharField(max_length=50, null=True)
    datestr = fields.CharField(max_length=10, null=True)
    acceptor_uuid = fields.ForeignKeyField(
        "models.Earners",
        related_name="jobs_like",
        null=False,
        source_field="acceptor_uuid"
    )
    requester_uuid = fields.ForeignKeyField(
        "models.Riders",
        related_name="jobs_like",
        null=False,
        source_field="requester_uuid"
    )
    begin_checkpoint_actual_location_hexagon_id9 = fields.CharField(max_length=50, null=True)
    begin_checkpoint_actual_location_latitude = fields.FloatField(null=True)
    begin_checkpoint_actual_location_longitude = fields.FloatField(null=True)
    begin_checkpoint_city = fields.ForeignKeyField(
        "models.Cities",
        related_name="jobs_like_begin",
        null=False
    )
    begin_checkpoint_ata_utc = fields.DatetimeField(null=True)

    end_checkpoint_actual_location_hexagon_id9 = fields.CharField(max_length=50, null=True)
    end_checkpoint_actual_location_latitude = fields.FloatField(null=True)
    end_checkpoint_actual_location_longitude = fields.FloatField(null=True)
    end_checkpoint_city = fields.ForeignKeyField(
        "models.Cities",
        related_name="jobs_like_end",
        null=False
    )
    end_checkpoint_ata_utc = fields.DatetimeField(null=True)

    global_product_name = fields.CharField(max_length=100, null=True)
    product_type_name = fields.CharField(max_length=100, null=True)
    fulfillment_job_status = fields.CharField(max_length=50, null=True)

    class Meta:
        app = "models"
        table = "jobs_like"
