-- DropIndex
DROP INDEX "notificacion_residente_id_idx";

-- CreateIndex
CREATE INDEX "idx_notif_residente" ON "notificacion"("residente_id", "leida", "fecha_creacion" DESC);
