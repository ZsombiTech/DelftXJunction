from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP INDEX IF EXISTS "idx_users_earne_user_id_fd664a";
        ALTER TABLE "incentives_weekly" DROP CONSTRAINT IF EXISTS "fk_incentiv_earners_eb6b7a69";
        ALTER TABLE "incentives_weekly" RENAME COLUMN "earner_id_id" TO "earner_id";
        CREATE TABLE IF NOT EXISTS "jobs_like" (
    "job_uuid" VARCHAR(100) NOT NULL PRIMARY KEY,
    "marketplace" VARCHAR(50),
    "datestr" VARCHAR(10),
    "begin_checkpoint_actual_location_hexagon_id9" VARCHAR(50),
    "begin_checkpoint_actual_location_latitude" DOUBLE PRECISION,
    "begin_checkpoint_actual_location_longitude" DOUBLE PRECISION,
    "begin_checkpoint_ata_utc" TIMESTAMPTZ,
    "end_checkpoint_actual_location_hexagon_id9" VARCHAR(50),
    "end_checkpoint_actual_location_latitude" DOUBLE PRECISION,
    "end_checkpoint_actual_location_longitude" DOUBLE PRECISION,
    "end_checkpoint_ata_utc" TIMESTAMPTZ,
    "global_product_name" VARCHAR(100),
    "product_type_name" VARCHAR(100),
    "fulfillment_job_status" VARCHAR(50),
    "acceptor_uuid" TEXT NOT NULL REFERENCES "earners" ("earner_id") ON DELETE CASCADE,
    "begin_checkpoint_city_id" INT NOT NULL REFERENCES "cities" ("city_id") ON DELETE CASCADE,
    "end_checkpoint_city_id" INT NOT NULL REFERENCES "cities" ("city_id") ON DELETE CASCADE,
    "requester_uuid" TEXT NOT NULL REFERENCES "riders" ("rider_id") ON DELETE CASCADE
);
        ALTER TABLE "users" ADD "isBreakMode" BOOL NOT NULL DEFAULT False;
        ALTER TABLE "incentives_weekly" ADD CONSTRAINT "fk_incentiv_earners_cdb48e43" FOREIGN KEY ("earner_id") REFERENCES "earners" ("earner_id") ON DELETE CASCADE;
        CREATE UNIQUE INDEX IF NOT EXISTS "uid_users_earne_user_id_a3712b" ON "users_earners" ("user_id", "earner_id");"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "incentives_weekly" DROP CONSTRAINT IF EXISTS "fk_incentiv_earners_cdb48e43";
        DROP INDEX IF EXISTS "uid_users_earne_user_id_a3712b";
        ALTER TABLE "users" DROP COLUMN "isBreakMode";
        ALTER TABLE "incentives_weekly" RENAME COLUMN "earner_id" TO "earner_id_id";
        DROP TABLE IF EXISTS "jobs_like";
        CREATE INDEX IF NOT EXISTS "idx_users_earne_user_id_fd664a" ON "users_earners" ("user_id");
        ALTER TABLE "incentives_weekly" ADD CONSTRAINT "fk_incentiv_earners_eb6b7a69" FOREIGN KEY ("earner_id_id") REFERENCES "earners" ("earner_id") ON DELETE CASCADE;"""
