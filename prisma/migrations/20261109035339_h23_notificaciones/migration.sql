/*
  Warnings:

  - Added the required column `unit` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('RESIDENTE', 'ADMINISTRADOR', 'SEGURIDAD');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('PENDIENTE_RETIRO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('PENDIENTE', 'ENVIADA', 'FALLIDO', 'FALLIDO_PERMANENTE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'RESIDENTE',
ADD COLUMN     "unit" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "tower" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "folio" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Abierto',
    "unit" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_photos" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_id" UUID NOT NULL,

    CONSTRAINT "report_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferencia_notificacion" (
    "id" SERIAL NOT NULL,
    "residente_id" UUID NOT NULL,
    "modulo_origen" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "preferencia_notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lote_notificacion" (
    "id" SERIAL NOT NULL,
    "modulo_origen" TEXT NOT NULL,
    "emitido_por" UUID,
    "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lote_notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacion" (
    "id" SERIAL NOT NULL,
    "lote_id" INTEGER NOT NULL,
    "residente_id" UUID NOT NULL,
    "unidad_id" UUID,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "modulo_origen" TEXT NOT NULL,
    "enlace_accion" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_lectura" TIMESTAMPTZ,
    "forzada" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intento_envio" (
    "id" SERIAL NOT NULL,
    "notificacion_id" INTEGER NOT NULL,
    "numero_intento" INTEGER NOT NULL,
    "motivo_fallo" TEXT,
    "fecha_intento" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intento_envio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "units_code_key" ON "units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "packages_number_key" ON "packages"("number");

-- CreateIndex
CREATE UNIQUE INDEX "packages_folio_key" ON "packages"("folio");

-- CreateIndex
CREATE INDEX "packages_status_received_at_idx" ON "packages"("status", "received_at");

-- CreateIndex
CREATE INDEX "packages_unit_id_idx" ON "packages"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "reports_folio_key" ON "reports"("folio");

-- CreateIndex
CREATE INDEX "report_photos_report_id_idx" ON "report_photos"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "preferencia_notificacion_residente_id_modulo_origen_key" ON "preferencia_notificacion"("residente_id", "modulo_origen");

-- CreateIndex
CREATE INDEX "notificacion_estado_idx" ON "notificacion"("estado");

-- CreateIndex
CREATE INDEX "notificacion_residente_id_idx" ON "notificacion"("residente_id");

-- CreateIndex
CREATE INDEX "intento_envio_notificacion_id_idx" ON "intento_envio"("notificacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "intento_envio_notificacion_id_numero_intento_key" ON "intento_envio"("notificacion_id", "numero_intento");

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_delivered_by_id_fkey" FOREIGN KEY ("delivered_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_photos" ADD CONSTRAINT "report_photos_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferencia_notificacion" ADD CONSTRAINT "preferencia_notificacion_residente_id_fkey" FOREIGN KEY ("residente_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_notificacion" ADD CONSTRAINT "lote_notificacion_emitido_por_fkey" FOREIGN KEY ("emitido_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lote_notificacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_residente_id_fkey" FOREIGN KEY ("residente_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intento_envio" ADD CONSTRAINT "intento_envio_notificacion_id_fkey" FOREIGN KEY ("notificacion_id") REFERENCES "notificacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
