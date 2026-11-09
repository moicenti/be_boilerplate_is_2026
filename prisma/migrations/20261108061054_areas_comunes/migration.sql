-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRADOR', 'RESIDENTE');

-- CreateEnum
CREATE TYPE "CommonAreaStatus" AS ENUM ('ACTIVA', 'ELIMINADA');

-- CreateEnum
CREATE TYPE "CommonAreaBlockReason" AS ENUM ('MANTENIMIENTO', 'RENOVACION', 'OTRO');

-- CreateEnum
CREATE TYPE "CommonAreaChangeField" AS ENUM ('CAPACIDAD', 'HORARIOS');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'RESIDENTE';

-- CreateTable
CREATE TABLE "area_comun" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "estado" "CommonAreaStatus" NOT NULL DEFAULT 'ACTIVA',
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminado_en" TIMESTAMPTZ(6),
    "eliminado_por" UUID,

    CONSTRAINT "area_comun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horario_area" (
    "id" SERIAL NOT NULL,
    "area_id" INTEGER NOT NULL,
    "dia_semana" SMALLINT NOT NULL,
    "hora_apertura" TIME(0) NOT NULL,
    "hora_cierre" TIME(0) NOT NULL,

    CONSTRAINT "horario_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueo_area" (
    "id" SERIAL NOT NULL,
    "area_id" INTEGER NOT NULL,
    "inicio" TIMESTAMPTZ(6) NOT NULL,
    "fin" TIMESTAMPTZ(6) NOT NULL,
    "motivo" "CommonAreaBlockReason" NOT NULL,

    CONSTRAINT "bloqueo_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_area" (
    "id" SERIAL NOT NULL,
    "area_id" INTEGER NOT NULL,
    "campo" "CommonAreaChangeField" NOT NULL,
    "valor_anterior" JSONB NOT NULL,
    "valor_nuevo" JSONB NOT NULL,
    "usuario_id" UUID,
    "cambiado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva" (
    "id" SERIAL NOT NULL,
    "area_id" INTEGER NOT NULL,
    "usuario_id" UUID NOT NULL,
    "inicio" TIMESTAMPTZ(6) NOT NULL,
    "fin" TIMESTAMPTZ(6) NOT NULL,
    "estado" "ReservationStatus" NOT NULL DEFAULT 'PENDIENTE',
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "area_comun_nombre_activa_key" ON "area_comun"("nombre") WHERE (estado = 'ACTIVA');

-- CreateIndex
CREATE UNIQUE INDEX "horario_area_area_id_dia_semana_key" ON "horario_area"("area_id", "dia_semana");

-- CreateIndex
CREATE INDEX "bloqueo_area_area_id_idx" ON "bloqueo_area"("area_id");

-- CreateIndex
CREATE INDEX "historial_area_area_id_idx" ON "historial_area"("area_id");

-- CreateIndex
CREATE INDEX "reserva_area_id_inicio_idx" ON "reserva"("area_id", "inicio");

-- AddForeignKey
ALTER TABLE "area_comun" ADD CONSTRAINT "area_comun_eliminado_por_fkey" FOREIGN KEY ("eliminado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_area" ADD CONSTRAINT "horario_area_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area_comun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueo_area" ADD CONSTRAINT "bloqueo_area_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area_comun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_area" ADD CONSTRAINT "historial_area_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area_comun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_area" ADD CONSTRAINT "historial_area_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area_comun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reglas de negocio que Prisma no expresa en el schema (DB-6.1).
ALTER TABLE "area_comun" ADD CONSTRAINT "area_comun_capacidad_check" CHECK ("capacidad" > 0);
ALTER TABLE "horario_area" ADD CONSTRAINT "horario_area_dia_semana_check" CHECK ("dia_semana" BETWEEN 0 AND 6);
ALTER TABLE "horario_area" ADD CONSTRAINT "horario_area_horas_check" CHECK ("hora_cierre" > "hora_apertura");
ALTER TABLE "bloqueo_area" ADD CONSTRAINT "bloqueo_area_fechas_check" CHECK ("fin" > "inicio");
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_fechas_check" CHECK ("fin" > "inicio");
