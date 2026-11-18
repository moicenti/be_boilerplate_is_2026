/*
  Warnings:

  - You are about to drop the `cuota` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ejecucion_error` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ejecucion_generacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `regla_cuota` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `regla_cuota_historial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `regla_cuota_monto_tipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `regla_cuota_unidad` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cuota" DROP CONSTRAINT "cuota_regla_id_fkey";

-- DropForeignKey
ALTER TABLE "cuota" DROP CONSTRAINT "cuota_unidad_id_fkey";

-- DropForeignKey
ALTER TABLE "ejecucion_error" DROP CONSTRAINT "ejecucion_error_ejecucion_id_fkey";

-- DropForeignKey
ALTER TABLE "ejecucion_error" DROP CONSTRAINT "ejecucion_error_unidad_id_fkey";

-- DropForeignKey
ALTER TABLE "ejecucion_generacion" DROP CONSTRAINT "ejecucion_generacion_regla_id_fkey";

-- DropForeignKey
ALTER TABLE "ejecucion_generacion" DROP CONSTRAINT "ejecucion_generacion_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "regla_cuota" DROP CONSTRAINT "regla_cuota_creado_por_fkey";

-- DropForeignKey
ALTER TABLE "regla_cuota_historial" DROP CONSTRAINT "regla_cuota_historial_regla_id_fkey";

-- DropForeignKey
ALTER TABLE "regla_cuota_historial" DROP CONSTRAINT "regla_cuota_historial_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "regla_cuota_monto_tipo" DROP CONSTRAINT "regla_cuota_monto_tipo_regla_id_fkey";

-- DropForeignKey
ALTER TABLE "regla_cuota_unidad" DROP CONSTRAINT "regla_cuota_unidad_regla_id_fkey";

-- DropForeignKey
ALTER TABLE "regla_cuota_unidad" DROP CONSTRAINT "regla_cuota_unidad_unidad_id_fkey";

-- DropTable
DROP TABLE "cuota";

-- DropTable
DROP TABLE "ejecucion_error";

-- DropTable
DROP TABLE "ejecucion_generacion";

-- DropTable
DROP TABLE "regla_cuota";

-- DropTable
DROP TABLE "regla_cuota_historial";

-- DropTable
DROP TABLE "regla_cuota_monto_tipo";

-- DropTable
DROP TABLE "regla_cuota_unidad";

-- DropEnum
DROP TYPE "FeeAmountType";

-- DropEnum
DROP TYPE "FeeRuleAction";

-- DropEnum
DROP TYPE "FeeRuleScope";

-- DropEnum
DROP TYPE "FeeRuleStatus";

-- DropEnum
DROP TYPE "FeeStatus";

-- DropEnum
DROP TYPE "GenerationOrigin";

-- DropEnum
DROP TYPE "GenerationRunStatus";

-- DropEnum
DROP TYPE "InactiveUnitPolicy";
