-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('PENDIENTE_RETIRO', 'ENTREGADO');

-- CreateTable
CREATE TABLE "packages" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "folio" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "tracking_reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "pickup_code" CHAR(6) NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'PENDIENTE_RETIRO',
    "unit_id" UUID NOT NULL,
    "received_by_id" UUID NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_to" TEXT,
    "delivered_by_id" UUID,
    "delivered_at" TIMESTAMP(3),
    "reminder_sent_at" TIMESTAMP(3),

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "packages_number_key" ON "packages"("number");

-- CreateIndex
CREATE UNIQUE INDEX "packages_folio_key" ON "packages"("folio");

-- CreateIndex
CREATE INDEX "packages_status_received_at_idx" ON "packages"("status", "received_at");

-- CreateIndex
CREATE INDEX "packages_unit_id_idx" ON "packages"("unit_id");

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_delivered_by_id_fkey" FOREIGN KEY ("delivered_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "packages" ADD CONSTRAINT "packages_pickup_code_check" CHECK ("pickup_code" ~ '^[0-9]{6}$');

-- AddCheckConstraint
ALTER TABLE "packages" ADD CONSTRAINT "packages_delivery_consistency_check" CHECK (
  ("status" = 'PENDIENTE_RETIRO' AND "delivered_to" IS NULL AND "delivered_by_id" IS NULL AND "delivered_at" IS NULL)
  OR
  ("status" = 'ENTREGADO' AND "delivered_to" IS NOT NULL AND "delivered_by_id" IS NOT NULL AND "delivered_at" IS NOT NULL)
);
