-- AlterEnum
ALTER TYPE "CommonAreaChangeField" ADD VALUE 'DURACION_BLOQUE';

-- AlterTable
-- Los DEFAULT solo rellenan las filas existentes; luego se quitan para que
-- ubicación y duración de bloque sean obligatorias en cada alta.
ALTER TABLE "area_comun" ADD COLUMN "ubicacion" TEXT NOT NULL DEFAULT 'Sin especificar',
ADD COLUMN "duracion_bloque_horas" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "condiciones_uso" TEXT;

ALTER TABLE "area_comun" ALTER COLUMN "ubicacion" DROP DEFAULT,
ALTER COLUMN "duracion_bloque_horas" DROP DEFAULT;
