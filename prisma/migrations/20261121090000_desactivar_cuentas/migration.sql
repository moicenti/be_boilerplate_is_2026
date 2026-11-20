-- Inicio del historial visible de la unidad para residentes nuevos.
ALTER TABLE "units" ADD COLUMN "historial_desde" TIMESTAMPTZ(6);
