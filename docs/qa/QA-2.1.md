# QA-2.1: Pruebas de aceptación de H2

**Historia:** H2. Visualización de unidades en mora
**Ejecutó:** _pendiente_
**Fecha:** _pendiente_
**Entorno:** local. Backend NestJS en `localhost:3000` y PostgreSQL con `npm run db:seed`.
**Rama:** `feature/H2-Visualizacion-de-unidades-en-mora`

> Estado: casos de prueba documentados y verificados contra la API con las pruebas e2e. Falta ejecutarlos desde el frontend (FE-2.1) y completar la columna «Resultado».

## Datos de prueba

`npm run db:seed` (ver [README](../../README.md#datos-demo-qa-21)). Las fechas son relativas al día en que se corre el seed:

| Unidad | Torre | Caso | ¿En mora? |
| --- | --- | --- | --- |
| B-402 | Torre B | Dos cuotas vencidas sin pagar (hace 87 y 56 días), 200.00 | Sí, desde hace 87 días |
| A-19 | Torre A | Cuota parcial vencida (saldo 60.00) más la del mes si ya pasó el día 10 | Sí |
| A-20 | Torre A | Cuota del mes, si ya pasó el día 10 | Sí, si ya venció |
| C-101 a C-118 | Torre C | Cuota generada de hace dos meses (H34) | Sí |
| B-205 | Torre B | Cuota vencida pero pagada | No |
| B-103 | Torre B | Cuota que vence hoy (solo el día del seed) | No |
| A-202 | Torre A | Cuota que vence en 10 días (al día) | No |

## Usuarios utilizados

Contraseña de todos: la de `SEED_DEMO_PASSWORD`

| Rol | Correo |
| --- | --- |
| Administración | `admin@example.com` |
| Residente | `demo@example.com` (A-19), `sofia.herrera@example.com` (B-402) |
| Seguridad | `ricardo.soto@example.com` |

## Casos

| # | Criterio | Pasos | Usuario | Resultado esperado | Resultado | Prueba automática (`test/mora.e2e-spec.ts`) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Dado** que existen cuotas vencidas sin pagar, **cuando** consulto las unidades en mora, **entonces** veo cada unidad morosa con la fecha desde la que está en mora y el monto que adeuda. | Abrir Morosidad sin filtros. | Administración | Primero B-402: en mora desde hace 87 días, 200.00, 2 cuotas, responsable `sofia.herrera@example.com`. No aparecen B-205, B-103 ni A-202. | ⏳ | lista cada unidad morosa con la fecha desde la que está en mora y lo que adeuda |
| 2 | **Dado** que una unidad paga todo lo vencido, **cuando** vuelvo a consultar, **entonces** ya no aparece como morosa. | Como `sofia.herrera@example.com`, pagar las dos cuotas vencidas de B-402 (200.00); volver a consultar como administración. | Residente / Administración | B-402 ya no aparece; el total baja en 1. | ⏳ | una unidad que paga todo lo vencido deja de aparecer |
| 3 | **Dado** que quiero acotar la lista, **cuando** filtro por torre o por antigüedad de la mora, **entonces** solo veo las unidades que cumplen el filtro. | Filtrar por «Torre B»; luego antigüedad mínima de 80 días; limpiar los filtros. | Administración | Torre B: solo B-402. 80 días: solo B-402. Al limpiar vuelve la lista completa. | ⏳ | filtra por torre sin distinguir mayúsculas; filtra por antigüedad mínima de la mora |
| 4 | **Dado** que no soy administrador, **cuando** intento acceder a esta información, **entonces** no puedo verla. | Llamar `GET /unidades/mora` como residente y como seguridad; abrir `/morosidad` en el frontend. | Residente / Seguridad | `403 ROL_NO_PERMITIDO`; el menú no muestra la opción. | ⏳ | 403 ROL_NO_PERMITIDO para residente / seguridad |

## Casos técnicos (BE-2.1)

| Verificación | Resultado esperado | Resultado | Prueba automática |
| --- | --- | --- | --- |
| Una cuota que vence hoy no cuenta; `PAGADA` y `ANULADA` se excluyen | B-103 y B-205 no aparecen | ⏳ | lista cada unidad morosa… (fixtures con vence hoy, pagada y anulada); `delinquency.spec.ts` |
| Orden por columna y paginación | `orden=montoAdeudado`, `-diasAtraso`…; `pagina`/`tamano` devuelven la porción esperada y `total` cuenta todas | ⏳ | ordena y pagina; `delinquency.service.spec.ts` |
| Parámetros inválidos | `pagina=0`, `tamano=101`, `orden=monto`, `antiguedadMinDias=-1`, parámetro desconocido → `400 SOLICITUD_INVALIDA` | ⏳ | 400 SOLICITUD_INVALIDA con parámetros inválidos |
| Sin sesión | `401 NO_AUTENTICADO` | ⏳ | 401 NO_AUTENTICADO sin sesión |
| Rendimiento | Menos de 2 s con 500 unidades en mora (3 cuotas cada una) | ⏳ | responde en menos de 2 s con 500 unidades en mora |

## Pruebas automáticas

| Comando | Resultado |
| --- | --- |
| `npx vitest run src/pagos` | Unitarias de la regla de mora y del servicio (filtros, orden, paginación) |
| `npm run test:e2e` | `test/mora.e2e-spec.ts`: 10 pruebas contra PostgreSQL |

## Resultado

_Pendiente de la ejecución con el frontend._
