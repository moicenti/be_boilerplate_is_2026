CREATE TABLE IF NOT EXISTS "participacion_votacion" (
    "id" UUID NOT NULL,
    "tema_id" UUID NOT NULL,
    "unidad_id" UUID NOT NULL,
    "residente_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participacion_votacion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "participacion_votacion_tema_id_unidad_id_key"
  ON "participacion_votacion"("tema_id", "unidad_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'participacion_votacion_tema_id_fkey'
  ) THEN
    ALTER TABLE "participacion_votacion"
      ADD CONSTRAINT "participacion_votacion_tema_id_fkey"
      FOREIGN KEY ("tema_id") REFERENCES "temas_votacion"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'participacion_votacion_unidad_id_fkey'
  ) THEN
    ALTER TABLE "participacion_votacion"
      ADD CONSTRAINT "participacion_votacion_unidad_id_fkey"
      FOREIGN KEY ("unidad_id") REFERENCES "units"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE OR REPLACE VIEW vw_participacion_votaciones AS
SELECT
  t.id AS tema_id,
  a.folio AS folio_asamblea,
  a.title AS asamblea_titulo,
  t.title AS titulo,
  t.opens_at AS apertura,
  t.closes_at AS cierre,
  TO_CHAR((t.closes_at AT TIME ZONE 'America/El_Salvador')::date, 'YYYY-MM-DD') AS fecha,
  GREATEST(
    1,
    (SELECT COUNT(*)::int FROM units u WHERE u.activa = true)
  ) AS unidades_habilitadas,
  COUNT(DISTINCT pv.unidad_id)::int AS votantes,
  ROUND(
    (
      COUNT(DISTINCT pv.unidad_id)::numeric
      / GREATEST(1, (SELECT COUNT(*) FROM units u WHERE u.activa = true))::numeric
    ) * 100,
    2
  )::numeric(5,2) AS participacion
FROM temas_votacion t
INNER JOIN asambleas a ON a.id = t.assembly_id
LEFT JOIN participacion_votacion pv ON pv.tema_id = t.id
WHERE a.published_at IS NOT NULL
  AND t.closes_at <= NOW()
GROUP BY t.id, a.folio, a.title, t.title, t.opens_at, t.closes_at;