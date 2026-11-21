-- Solo existen ADMINISTRADOR, RESIDENTE y SEGURIDAD. Las incidencias pasan a
-- asignarse y resolverse por administradores.

-- Los usuarios de mantenimiento se desactivan (no se promueven a admin) y quedan
-- como RESIDENTE sin unidad para conservar el historial de reportes asignados.
UPDATE "users"
SET "role" = 'RESIDENTE', "is_active" = false, "unit_id" = NULL
WHERE "role" = 'MANTENIMIENTO';

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('RESIDENTE', 'ADMINISTRADOR', 'SEGURIDAD');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'RESIDENTE';
COMMIT;
