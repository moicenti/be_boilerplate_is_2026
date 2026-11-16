-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('DEPARTAMENTO', 'CASA', 'LOCAL');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "FeeAmountType" AS ENUM ('FIJO', 'POR_TIPO_UNIDAD');

-- CreateEnum
CREATE TYPE "FeeRuleScope" AS ENUM ('TODAS', 'TIPO', 'TORRE', 'SELECCION');

-- CreateEnum
CREATE TYPE "InactiveUnitPolicy" AS ENUM ('GENERAR', 'OMITIR', 'REVISAR');

-- CreateEnum
CREATE TYPE "FeeRuleStatus" AS ENUM ('ACTIVA', 'PAUSADA', 'INACTIVA');

-- CreateEnum
CREATE TYPE "FeeRuleAction" AS ENUM ('CREACION', 'EDICION', 'CAMBIO_ESTADO');

-- CreateEnum
CREATE TYPE "GenerationOrigin" AS ENUM ('AUTOMATICA', 'MANUAL');

-- CreateEnum
CREATE TYPE "GenerationRunStatus" AS ENUM ('EN_CURSO', 'COMPLETADA', 'CON_ERRORES');

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "activa" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tipo" "UnitType" NOT NULL DEFAULT 'DEPARTAMENTO';

-- CreateTable
CREATE TABLE "cuota" (
    "id" SERIAL NOT NULL,
    "unidad_id" UUID NOT NULL,
    "regla_id" INTEGER,
    "concepto" TEXT NOT NULL,
    "periodo" CHAR(7) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "estado" "FeeStatus" NOT NULL DEFAULT 'PENDIENTE',
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regla_cuota" (
    "id" SERIAL NOT NULL,
    "concepto" TEXT NOT NULL,
    "tipo_monto" "FeeAmountType" NOT NULL,
    "monto" DECIMAL(12,2),
    "dia_generacion" SMALLINT NOT NULL,
    "dia_vencimiento" SMALLINT NOT NULL,
    "alcance" "FeeRuleScope" NOT NULL,
    "alcance_valor" TEXT,
    "politica_inactivas" "InactiveUnitPolicy" NOT NULL DEFAULT 'OMITIR',
    "estado" "FeeRuleStatus" NOT NULL DEFAULT 'ACTIVA',
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "regla_cuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regla_cuota_unidad" (
    "regla_id" INTEGER NOT NULL,
    "unidad_id" UUID NOT NULL,

    CONSTRAINT "regla_cuota_unidad_pkey" PRIMARY KEY ("regla_id","unidad_id")
);

-- CreateTable
CREATE TABLE "regla_cuota_monto_tipo" (
    "regla_id" INTEGER NOT NULL,
    "tipo_unidad" "UnitType" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "regla_cuota_monto_tipo_pkey" PRIMARY KEY ("regla_id","tipo_unidad")
);

-- CreateTable
CREATE TABLE "regla_cuota_historial" (
    "id" SERIAL NOT NULL,
    "regla_id" INTEGER NOT NULL,
    "accion" "FeeRuleAction" NOT NULL,
    "valor_anterior" JSONB,
    "valor_nuevo" JSONB NOT NULL,
    "usuario_id" UUID,
    "cambiado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regla_cuota_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejecucion_generacion" (
    "id" SERIAL NOT NULL,
    "regla_id" INTEGER NOT NULL,
    "periodo" CHAR(7) NOT NULL,
    "origen" "GenerationOrigin" NOT NULL,
    "usuario_id" UUID,
    "inicio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMPTZ(6),
    "creadas" INTEGER NOT NULL DEFAULT 0,
    "omitidas" INTEGER NOT NULL DEFAULT 0,
    "con_error" INTEGER NOT NULL DEFAULT 0,
    "estado" "GenerationRunStatus" NOT NULL DEFAULT 'EN_CURSO',

    CONSTRAINT "ejecucion_generacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejecucion_error" (
    "id" SERIAL NOT NULL,
    "ejecucion_id" INTEGER NOT NULL,
    "unidad_id" UUID NOT NULL,
    "causa" TEXT NOT NULL,

    CONSTRAINT "ejecucion_error_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cuota_unidad_id_estado_idx" ON "cuota"("unidad_id", "estado");

-- CreateIndex
CREATE INDEX "cuota_estado_fecha_vencimiento_idx" ON "cuota"("estado", "fecha_vencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "cuota_unidad_regla_periodo_key" ON "cuota"("unidad_id", "regla_id", "periodo");

-- CreateIndex
CREATE INDEX "regla_cuota_estado_dia_generacion_idx" ON "regla_cuota"("estado", "dia_generacion");

-- CreateIndex
CREATE INDEX "regla_cuota_historial_regla_id_idx" ON "regla_cuota_historial"("regla_id");

-- CreateIndex
CREATE INDEX "ejecucion_generacion_regla_id_periodo_idx" ON "ejecucion_generacion"("regla_id", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "ejecucion_generacion_en_curso_key" ON "ejecucion_generacion"("regla_id", "periodo") WHERE (estado = 'EN_CURSO');

-- CreateIndex
CREATE INDEX "ejecucion_error_ejecucion_id_idx" ON "ejecucion_error"("ejecucion_id");

-- AddForeignKey
ALTER TABLE "cuota" ADD CONSTRAINT "cuota_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuota" ADD CONSTRAINT "cuota_regla_id_fkey" FOREIGN KEY ("regla_id") REFERENCES "regla_cuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_cuota" ADD CONSTRAINT "regla_cuota_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_cuota_unidad" ADD CONSTRAINT "regla_cuota_unidad_regla_id_fkey" FOREIGN KEY ("regla_id") REFERENCES "regla_cuota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_cuota_unidad" ADD CONSTRAINT "regla_cuota_unidad_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_cuota_monto_tipo" ADD CONSTRAINT "regla_cuota_monto_tipo_regla_id_fkey" FOREIGN KEY ("regla_id") REFERENCES "regla_cuota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_cuota_historial" ADD CONSTRAINT "regla_cuota_historial_regla_id_fkey" FOREIGN KEY ("regla_id") REFERENCES "regla_cuota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_cuota_historial" ADD CONSTRAINT "regla_cuota_historial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejecucion_generacion" ADD CONSTRAINT "ejecucion_generacion_regla_id_fkey" FOREIGN KEY ("regla_id") REFERENCES "regla_cuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejecucion_generacion" ADD CONSTRAINT "ejecucion_generacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejecucion_error" ADD CONSTRAINT "ejecucion_error_ejecucion_id_fkey" FOREIGN KEY ("ejecucion_id") REFERENCES "ejecucion_generacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejecucion_error" ADD CONSTRAINT "ejecucion_error_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reglas de negocio que el esquema de Prisma no puede expresar.
ALTER TABLE "cuota" ADD CONSTRAINT "cuota_monto_positivo" CHECK ("monto" > 0);
ALTER TABLE "cuota" ADD CONSTRAINT "cuota_periodo_formato" CHECK ("periodo" ~ '^\d{4}-(0[1-9]|1[0-2])$');

-- Días 1 a 28: todos los meses los tienen.
ALTER TABLE "regla_cuota" ADD CONSTRAINT "regla_cuota_dias_validos" CHECK (
  "dia_generacion" BETWEEN 1 AND 28
  AND "dia_vencimiento" BETWEEN 1 AND 28
  AND "dia_vencimiento" >= "dia_generacion"
);
ALTER TABLE "regla_cuota" ADD CONSTRAINT "regla_cuota_monto_positivo" CHECK ("monto" IS NULL OR "monto" > 0);
-- TORRE y TIPO necesitan saber qué torre o qué tipo; los demás alcances no llevan valor.
ALTER TABLE "regla_cuota" ADD CONSTRAINT "regla_cuota_alcance_valor" CHECK (
  ("alcance" IN ('TORRE', 'TIPO')) = ("alcance_valor" IS NOT NULL)
);
ALTER TABLE "regla_cuota_monto_tipo" ADD CONSTRAINT "regla_cuota_monto_tipo_positivo" CHECK ("monto" > 0);

-- Una sola regla vigente (no INACTIVA) por concepto y alcance; el concepto se compara sin mayúsculas.
CREATE UNIQUE INDEX "regla_cuota_concepto_alcance_key" ON "regla_cuota" (
  lower("concepto"), "alcance", COALESCE("alcance_valor", '')
) WHERE "estado" <> 'INACTIVA';

ALTER TABLE "ejecucion_generacion" ADD CONSTRAINT "ejecucion_generacion_periodo_formato" CHECK ("periodo" ~ '^\d{4}-(0[1-9]|1[0-2])$');
ALTER TABLE "ejecucion_generacion" ADD CONSTRAINT "ejecucion_generacion_contadores" CHECK (
  "creadas" >= 0 AND "omitidas" >= 0 AND "con_error" >= 0
);
