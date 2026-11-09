-- DropIndex
DROP INDEX "bloqueo_area_area_id_idx";

-- AlterTable
ALTER TABLE "bloqueo_area" ADD COLUMN     "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creado_por" UUID;

-- CreateIndex
CREATE INDEX "bloqueo_area_area_id_inicio_idx" ON "bloqueo_area"("area_id", "inicio");

-- AddForeignKey
ALTER TABLE "bloqueo_area" ADD CONSTRAINT "bloqueo_area_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Dos bloqueos de la misma área no pueden superponerse. La restricción de
-- exclusión cubre también las carreras entre requests concurrentes.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "bloqueo_area" ADD CONSTRAINT "bloqueo_area_sin_superposicion"
  EXCLUDE USING gist ("area_id" WITH =, tstzrange("inicio", "fin") WITH &&);
