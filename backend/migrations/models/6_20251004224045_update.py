from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "earners" ALTER COLUMN "latitude" SET NOT NULL;
        ALTER TABLE "earners" ALTER COLUMN "longitude" SET NOT NULL;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "earners" ALTER COLUMN "latitude" DROP NOT NULL;
        ALTER TABLE "earners" ALTER COLUMN "longitude" DROP NOT NULL;"""
