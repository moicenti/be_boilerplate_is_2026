-- CreateEnum
CREATE TYPE "EstadoVisita" AS ENUM ('DENTRO', 'DENTRO_SIN_AUTORIZACION', 'SALIO');

-- CreateTable
CREATE TABLE "visitas_activas" (
    "id" UUID NOT NULL,
    "nombre_visitante" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "acompanantes" INTEGER NOT NULL DEFAULT 0,
    "motivo" TEXT,
    "estado" "EstadoVisita" NOT NULL,
    "entrada" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salida" TIMESTAMPTZ,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unidad_id" UUID NOT NULL,
    "preautorizacion_id" UUID,
    "registrado_por_id" UUID NOT NULL,
    "salida_registrada_por_id" UUID,

    CONSTRAINT "visitas_activas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visitas_activas_preautorizacion_id_key" ON "visitas_activas"("preautorizacion_id");

-- CreateIndex
CREATE INDEX "visitas_activas_documento_estado_idx" ON "visitas_activas"("documento", "estado");

-- CreateIndex
CREATE INDEX "visitas_activas_estado_idx" ON "visitas_activas"("estado");

-- AddForeignKey
ALTER TABLE "visitas_activas" ADD CONSTRAINT "visitas_activas_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_activas" ADD CONSTRAINT "visitas_activas_preautorizacion_id_fkey" FOREIGN KEY ("preautorizacion_id") REFERENCES "pre_autorizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_activas" ADD CONSTRAINT "visitas_activas_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_activas" ADD CONSTRAINT "visitas_activas_salida_registrada_por_id_fkey" FOREIGN KEY ("salida_registrada_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
