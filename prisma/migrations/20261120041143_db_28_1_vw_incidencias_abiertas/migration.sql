CREATE OR REPLACE VIEW vw_incidencias_abiertas AS
SELECT
  r.id,
  r.folio,
  r.title AS titulo,
  r.description AS descripcion,
  r.category AS categoria,
  r.location AS ubicacion,
  r.unit AS unidad,
  COALESCE(u.tower, 'Sin sección') AS seccion,
  UPPER(REPLACE(TRIM(r.status), ' ', '_')) AS estado,
  COALESCE(r.priority::text, 'SIN_PRIORIDAD') AS prioridad,
  r.created_at AS fecha_creacion,
  GREATEST(
    0,
    (
      (CURRENT_TIMESTAMP AT TIME ZONE 'America/El_Salvador')::date
      - (r.created_at AT TIME ZONE 'America/El_Salvador')::date
    )
  )::int AS dias_abierta
FROM reports r
LEFT JOIN units u ON u.code = r.unit
WHERE UPPER(REPLACE(TRIM(r.status), ' ', '_')) IN ('ABIERTO', 'EN_PROCESO');