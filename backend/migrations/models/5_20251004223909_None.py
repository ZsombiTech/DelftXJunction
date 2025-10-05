from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "cities" (
    "city_id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "zones" JSONB
);
CREATE TABLE IF NOT EXISTS "customers" (
    "customer_id" TEXT NOT NULL PRIMARY KEY,
    "order_frequency" VARCHAR(50),
    "payment_type" VARCHAR(50)
);
CREATE TABLE IF NOT EXISTS "earners" (
    "earner_id" TEXT NOT NULL PRIMARY KEY,
    "earner_type" VARCHAR(50) NOT NULL,
    "vehicle_type" VARCHAR(50),
    "fuel_type" VARCHAR(50),
    "is_ev" BOOL NOT NULL DEFAULT False,
    "experience_months" INT,
    "rating" DOUBLE PRECISION,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "longitude" DOUBLE PRECISION DEFAULT 0,
    "latitude" DOUBLE PRECISION DEFAULT 0,
    "destination_zone" VARCHAR(100),
    "home_city_id" INT REFERENCES "cities" ("city_id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "incentives_weekly" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "week" TEXT NOT NULL,
    "program" VARCHAR(100),
    "target_jobs" INT,
    "completed_jobs" INT,
    "achieved" BOOL NOT NULL DEFAULT False,
    "bonus_eur" DOUBLE PRECISION,
    "earner_id_id" TEXT NOT NULL REFERENCES "earners" ("earner_id") ON DELETE CASCADE,
    CONSTRAINT "uid_incentives__earner__2dc4d9" UNIQUE ("earner_id_id", "week")
);
CREATE TABLE IF NOT EXISTS "merchants" (
    "merchant_id" TEXT NOT NULL PRIMARY KEY,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "hex_id9" VARCHAR(9),
    "city_id" INT REFERENCES "cities" ("city_id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "eats_orders" (
    "order_id" TEXT NOT NULL PRIMARY KEY,
    "vehicle_type" VARCHAR(50),
    "is_ev" BOOL NOT NULL DEFAULT False,
    "start_time" TIMETZ,
    "end_time" TIMETZ,
    "pickup_lat" DOUBLE PRECISION,
    "pickup_lng" DOUBLE PRECISION,
    "pickup_hex_id9" VARCHAR(9),
    "drop_lat" DOUBLE PRECISION,
    "drop_lng" DOUBLE PRECISION,
    "drop_hex_id9" VARCHAR(9),
    "distance" DOUBLE PRECISION,
    "duration_mins" DOUBLE PRECISION,
    "basket_value_eur" DOUBLE PRECISION,
    "delvery_fee_eur" DOUBLE PRECISION,
    "tip_eur" DOUBLE PRECISION,
    "net_earnings" DOUBLE PRECISION,
    "payment_type" VARCHAR(50),
    "date" DATE,
    "city_id_id" INT REFERENCES "cities" ("city_id") ON DELETE CASCADE,
    "courier_id_id" TEXT REFERENCES "earners" ("earner_id") ON DELETE CASCADE,
    "customer_id_id" TEXT REFERENCES "customers" ("customer_id") ON DELETE CASCADE,
    "merchant_id_id" TEXT REFERENCES "merchants" ("merchant_id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "riders" (
    "rider_id" TEXT NOT NULL PRIMARY KEY,
    "trip_frequency" VARCHAR(50),
    "preferred_product" VARCHAR(100),
    "payment_type" VARCHAR(50)
);
CREATE TABLE IF NOT EXISTS "timeslots" (
    "timeslot_id" SERIAL NOT NULL PRIMARY KEY,
    "user_id" INT NOT NULL,
    "earner_id" TEXT,
    "start_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMPTZ,
    "is_active" BOOL NOT NULL DEFAULT True
);
CREATE TABLE IF NOT EXISTS "users" (
    "user_id" SERIAL NOT NULL PRIMARY KEY,
    "email" VARCHAR(100) NOT NULL UNIQUE,
    "password" VARCHAR(128) NOT NULL,
    "firstname" VARCHAR(30),
    "lastname" VARCHAR(30)
);
CREATE TABLE IF NOT EXISTS "users_earners" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "earner_id" TEXT NOT NULL REFERENCES "earners" ("earner_id") ON DELETE CASCADE,
    "user_id" INT NOT NULL REFERENCES "users" ("user_id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_users_earne_user_id_fd664a" ON "users_earners" ("user_id");
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """
