from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "earners" ADD "destination_zone" VARCHAR(100);
        CREATE TABLE IF NOT EXISTS "timeslots" (
    "timeslot_id" SERIAL NOT NULL PRIMARY KEY,
    "user_id" INT NOT NULL,
    "earner_id" TEXT,
    "start_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMPTZ,
    "is_active" BOOL NOT NULL DEFAULT True
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "earners" DROP COLUMN "destination_zone";
        DROP TABLE IF EXISTS "timeslots";"""
