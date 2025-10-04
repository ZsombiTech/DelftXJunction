from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP INDEX IF EXISTS "uid_users_usernam_266d85";
        ALTER TABLE "users" ADD "isBreakMode" BOOL NOT NULL DEFAULT False;
        """


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "users" DROP COLUMN "isBreakMode";
        CREATE UNIQUE INDEX IF NOT EXISTS "uid_users_usernam_266d85" ON "users" ("username");"""
