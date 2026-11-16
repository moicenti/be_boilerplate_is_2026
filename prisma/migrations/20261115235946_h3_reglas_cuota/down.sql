-- Reversión manual de 20261115235946_h3_reglas_cuota (Prisma no genera migraciones "down").
-- Uso: psql -f down.sql y luego
--   DELETE FROM _prisma_migrations WHERE migration_name = '20261115235946_h3_reglas_cuota';
DROP TABLE IF EXISTS "ejecucion_error";
DROP TABLE IF EXISTS "ejecucion_generacion";
DROP TABLE IF EXISTS "regla_cuota_historial";
DROP TABLE IF EXISTS "regla_cuota_monto_tipo";
DROP TABLE IF EXISTS "regla_cuota_unidad";
DROP TABLE IF EXISTS "cuota";
DROP TABLE IF EXISTS "regla_cuota";
ALTER TABLE "units" DROP COLUMN IF EXISTS "activa", DROP COLUMN IF EXISTS "tipo";
DROP TYPE IF EXISTS "GenerationRunStatus";
DROP TYPE IF EXISTS "GenerationOrigin";
DROP TYPE IF EXISTS "FeeRuleAction";
DROP TYPE IF EXISTS "FeeRuleStatus";
DROP TYPE IF EXISTS "InactiveUnitPolicy";
DROP TYPE IF EXISTS "FeeRuleScope";
DROP TYPE IF EXISTS "FeeAmountType";
DROP TYPE IF EXISTS "FeeStatus";
DROP TYPE IF EXISTS "UnitType";
