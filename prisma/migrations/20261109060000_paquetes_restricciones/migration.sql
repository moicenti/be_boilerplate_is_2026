-- Reglas de H13 (DB-13.1) que la migración de H23 no incluyó al crear "packages".
ALTER TABLE "packages" ADD CONSTRAINT "packages_pickup_code_check" CHECK ("pickup_code" ~ '^[0-9]{6}$');

ALTER TABLE "packages" ADD CONSTRAINT "packages_delivery_consistency_check" CHECK (
  ("status" = 'PENDIENTE_RETIRO' AND "delivered_to" IS NULL AND "delivered_by_id" IS NULL AND "delivered_at" IS NULL)
  OR
  ("status" = 'ENTREGADO' AND "delivered_to" IS NOT NULL AND "delivered_by_id" IS NOT NULL AND "delivered_at" IS NOT NULL)
);
