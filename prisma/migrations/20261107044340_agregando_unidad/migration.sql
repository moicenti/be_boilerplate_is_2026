/*
  Warnings:

  - Added the required column `unit` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "unit" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "unit" TEXT DEFAULT 'Sin asignar';
