-- CreateEnum
CREATE TYPE "EstadoPreAutorizacion" AS ENUM ('VIGENTE', 'USADA', 'CANCELADA', 'EXPIRADA');

-- CreateTable
CREATE TABLE "pre_autorizaciones" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre_visitante" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "motivo" TEXT,
    "acompanantes" INTEGER NOT NULL DEFAULT 0,
    "inicio" TIMESTAMPTZ NOT NULL,
    "fin" TIMESTAMPTZ NOT NULL,
    "estado" "EstadoPreAutorizacion" NOT NULL DEFAULT 'VIGENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unidad_id" UUID NOT NULL,
    "residente_id" UUID NOT NULL,

    CONSTRAINT "pre_autorizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pre_autorizaciones_codigo_key" ON "pre_autorizaciones"("codigo");

-- CreateIndex
CREATE INDEX "pre_autorizaciones_documento_idx" ON "pre_autorizaciones"("documento");

-- CreateIndex
CREATE INDEX "pre_autorizaciones_estado_idx" ON "pre_autorizaciones"("estado");

-- AddForeignKey
ALTER TABLE "pre_autorizaciones" ADD CONSTRAINT "pre_autorizaciones_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_autorizaciones" ADD CONSTRAINT "pre_autorizaciones_residente_id_fkey" FOREIGN KEY ("residente_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
