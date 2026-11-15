-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MANTENIMIENTO';

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "assignee_id" UUID,
ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "priority" "Priority",
ADD COLUMN     "priority_justification" TEXT,
ADD COLUMN     "resolution_comment" TEXT,
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "resolved_by_id" UUID;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "unit" DROP NOT NULL;

-- CreateTable
CREATE TABLE "report_events" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "user_id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_events_report_id_idx" ON "report_events"("report_id");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_events" ADD CONSTRAINT "report_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_events" ADD CONSTRAINT "report_events_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
