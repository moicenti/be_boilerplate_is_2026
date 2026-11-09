/*
  Warnings:

  - Made the column `unit` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "unit" SET NOT NULL,
ALTER COLUMN "unit" DROP DEFAULT;
