/*
  Warnings:

  - A unique constraint covering the columns `[puuid]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `game_name` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `puuid` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "game_name" TEXT NOT NULL,
ADD COLUMN     "puuid" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "account_ranks" (
    "id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "league_points" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "fk_account" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_ranks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_ranks_fk_account_created_at_idx" ON "account_ranks"("fk_account", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_puuid_key" ON "accounts"("puuid");

-- AddForeignKey
ALTER TABLE "account_ranks" ADD CONSTRAINT "account_ranks_fk_account_fkey" FOREIGN KEY ("fk_account") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
