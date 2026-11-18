# H26. Panel general de indicadores: fórmulas y consultas de referencia

Endpoint: `GET /api/v1/reportes/resumen?desde=AAAA-MM-DD&hasta=AAAA-MM-DD&seccion=X`. Solo ADMINISTRADOR.

El panel no tiene tablas propias. Cada indicador se calcula con su propio `try/catch` y en paralelo;
si uno falla, se registra en el log y ese indicador responde `{ "estado": "no_disponible" }` sin
afectar a los demás. Cada valor debe coincidir con el de su reporte de detalle. Meta: menos de 3 s.

## Filtros

| Parámetro | Regla |
|---|---|
| `desde` | `AAAA-MM-DD`, fecha real. Por defecto, el día 1 del mes en curso |
| `hasta` | `AAAA-MM-DD`, fecha real. Por defecto, hoy (hora de El Salvador). Es la fecha de corte de la morosidad |
| `seccion` | Opcional. Debe existir. Hoy se valida contra `Unit.tower` |
| Error | `400 FILTROS_INVALIDOS` si `desde > hasta`, el formato es inválido o la sección no existe |

> **Por confirmar con el equipo.** El filtro dice "sección", pero el modelo separa torre y sección.
> Falta decidir si se filtra por una, por otra o por ambas. Los valores por defecto de `desde` y
> `hasta` tampoco vienen en el diseño.

## Indicadores

| Indicador | Fórmula | Mismo valor que | Estado |
|---|---|---|---|
| `morosidad` | unidades morosas ÷ unidades ACTIVAS × 100, a la fecha de corte. Unidad morosa: al menos una cuota `PENDIENTE` o `PARCIAL` con vencimiento anterior a hoy (la que vence hoy no cuenta; las anuladas se excluyen). Devuelve también `monto` adeudado | H2 | Pendiente: no hay modelo de cuotas |
| `ocupacion` | horas de reservas `CONFIRMADA` ÷ horas de uso permitido del área en el periodo × 100, sin contar bloqueos | H27 `vw_ocupacion_areas` | Pendiente de la vista |
| `incidencias` | cantidad de incidencias en `ABIERTO` o `EN_PROCESO` | H28 `vw_incidencias_abiertas` | Pendiente de la vista |
| `participacion` | unidades que votaron ÷ unidades habilitadas × 100 (habilitadas = unidades ACTIVAS al abrir la votación) | H29 `vw_participacion_votaciones` | Pendiente de la vista |

## Consultas SQL de referencia

Se completan al conectar cada fuente, porque deben ser las mismas de los reportes de detalle:

- Morosidad: consulta del reporte H2.
- Ocupación: `SELECT ... FROM vw_ocupacion_areas`.
- Incidencias: `SELECT COUNT(*) FROM vw_incidencias_abiertas`.
- Participación: `SELECT ... FROM vw_participacion_votaciones`.

## Cómo conectar un indicador

Cada uno vive en `src/reportes/services/indicadores/<nombre>.indicador.ts`. Se reemplaza el cuerpo de
`calcular(filtros)`, que hoy lanza `FuenteNoDisponibleError`, y se conserva la forma del resultado.
Si el acceso a datos es nuevo, va en un repositorio, igual que en el resto del proyecto.
