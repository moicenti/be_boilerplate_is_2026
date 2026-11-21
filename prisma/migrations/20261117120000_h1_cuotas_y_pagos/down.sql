-- Revierte 20261117120000_h1_cuotas_y_pagos. Prisma no aplica este archivo; se ejecuta a mano:
--   npx prisma db execute --file prisma/migrations/20261117120000_h1_cuotas_y_pagos/down.sql
-- Ojo: también elimina las tablas de cuotas de H3 que esa migración restaura.

-- DropForeignKey
ALTER TABLE "public"."cuota" DROP CONSTRAINT "cuota_unidad_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."cuota" DROP CONSTRAINT "cuota_regla_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."pago" DROP CONSTRAINT "pago_unidad_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."pago" DROP CONSTRAINT "pago_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."pago_cuota" DROP CONSTRAINT "pago_cuota_pago_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."pago_cuota" DROP CONSTRAINT "pago_cuota_cuota_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."regla_cuota" DROP CONSTRAINT "regla_cuota_creado_por_fkey";

-- DropForeignKey
ALTER TABLE "public"."regla_cuota_unidad" DROP CONSTRAINT "regla_cuota_unidad_regla_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."regla_cuota_unidad" DROP CONSTRAINT "regla_cuota_unidad_unidad_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."regla_cuota_monto_tipo" DROP CONSTRAINT "regla_cuota_monto_tipo_regla_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."regla_cuota_historial" DROP CONSTRAINT "regla_cuota_historial_regla_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."regla_cuota_historial" DROP CONSTRAINT "regla_cuota_historial_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ejecucion_generacion" DROP CONSTRAINT "ejecucion_generacion_regla_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ejecucion_generacion" DROP CONSTRAINT "ejecucion_generacion_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ejecucion_error" DROP CONSTRAINT "ejecucion_error_ejecucion_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ejecucion_error" DROP CONSTRAINT "ejecucion_error_unidad_id_fkey";

-- DropTable
DROP TABLE "public"."cuota";

-- DropTable
DROP TABLE "public"."pago";

-- DropTable
DROP TABLE "public"."pago_cuota";

-- DropTable
DROP TABLE "public"."regla_cuota";

-- DropTable
DROP TABLE "public"."regla_cuota_unidad";

-- DropTable
DROP TABLE "public"."regla_cuota_monto_tipo";

-- DropTable
DROP TABLE "public"."regla_cuota_historial";

-- DropTable
DROP TABLE "public"."ejecucion_generacion";

-- DropTable
DROP TABLE "public"."ejecucion_error";

-- DropEnum
DROP TYPE "public"."FeeStatus";

-- DropEnum
DROP TYPE "public"."FeeAmountType";

-- DropEnum
DROP TYPE "public"."FeeRuleScope";

-- DropEnum
DROP TYPE "public"."InactiveUnitPolicy";

-- DropEnum
DROP TYPE "public"."FeeRuleStatus";

-- DropEnum
DROP TYPE "public"."FeeRuleAction";

-- DropEnum
DROP TYPE "public"."GenerationOrigin";

-- DropEnum
DROP TYPE "public"."GenerationRunStatus";

-- Para que `prisma migrate deploy` vuelva a aplicarla.
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261117120000_h1_cuotas_y_pagos';
