-- AlterTable: add updated_at to users (DEFAULT CURRENT_TIMESTAMP handles existing rows)
ALTER TABLE "users" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('LOL', 'VALORANT', 'TFT', 'WILD_RIFT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "username_riot" TEXT NOT NULL,
    "tag_riot" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "status" "AccountStatus" NOT NULL,
    "fk_user" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_fk_user_fkey" FOREIGN KEY ("fk_user") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
