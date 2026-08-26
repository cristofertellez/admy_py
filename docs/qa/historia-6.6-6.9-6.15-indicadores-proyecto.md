# QA — Historias 6.6 / 6.9 / 6.15: Estimaciones, Indicadores y Métricas del Proyecto

Fecha: 2026-08-23

## Alcance

Pestaña "Indicators" en `/dashboard/projects/[id]` con estimaciones vs real (6.6),
indicadores automáticos con semáforo de riesgo (6.9) y métricas consolidadas con
carga de trabajo (6.15).

## Implementación

| Pieza | Ubicación |
|---|---|
| Cálculos puros (testeables, sin DB) | `features/projects/projects-indicators.ts` |
| Tipos del bundle | `features/projects/projects-indicators.types.ts` |
| Agregación + autorización de datos | `features/projects/projects-indicators.service.ts` |
| UI presentacional | `app/dashboard/projects/[id]/indicators-tab.tsx` |
| Integración en tabs | `project-tabs.tsx` (nueva pestaña "Indicators") |
| Carga server-side | `app/dashboard/projects/[id]/page.tsx` |

## Decisiones de negocio

| Regla | Definición |
|---|---|
| Horas consumidas | Prefiere suma histórica completa de `time_entries` (sin ventana temporal); si no hay, roll-up de `tasks.worked_hours`; último recurso `projects.worked_hours`. La ventana de 6 semanas se usa exclusivamente para el gráfico de carga de trabajo. |
| % completado | Promedio ponderado por `tasks.weight`; sin tareas usa `projects.completion_percentage`. |
| % retraso | max(0, progreso esperado lineal según cronograma − progreso real); nulo sin fechas base o finalizado. |
| Desviación | Días firmados: fin real (finalizado) u hoy (activo) contra fin estimado. |
| Riesgo (PRD §72) | Puntaje: sobrecosto >15% (+1), deslizamiento ≥15%/≥40% (+1/+2), bloqueadas ≥1/≥3 (+1/+2), dependencias abiertas (+1), hitos vencidos ≥1/≥2 (+1/+2), inactividad >14/>30 días (+1/+2). Nivel: 0=Low, 1–2=Medium, ≥3=High. |
| Salud | critical si riesgo High o deslizamiento ≥40; at_risk si Medium o ≥15; healthy en caso contrario. |
| Proyectos finalizados (Completed/Cancelled/Archived) | Sin penalización por cronograma ni inactividad. |

## Verificaciones

| Criterio | Resultado |
|---|---|
| Autorización: `assertProjectVisible` antes de cualquier consulta (Client/Intermediary solo ven sus proyectos) | PASS |
| Cálculos correctos: lógica aislada en funciones puras deterministas (`now` inyectable) | PASS |
| Estados vacíos: sin tareas/hitos/registros de tiempo muestra mensajes ("No tasks yet.", "No time logged…", "—") sin dividir por cero | PASS |
| Responsive: grids md:grid-cols-3 / sm:2 / lg:4 y lg:grid-cols-2 para charts | PASS |
| Accesibilidad: listas `<ul>`/`<dl>` semánticas, `aria-label` en salud/riesgo, `title` con puntaje de riesgo, contraste según tokens DESIGN.md | PASS |
| Reutilización: Card/Badge compartidos, ProgressRing y BarChart existentes; sin nuevos colores ni patrones fuera de DESIGN.md | PASS |
| `npx tsc --noEmit` sin errores TypeScript | PASS (2026-08-23) |
| `npx eslint` sobre archivos nuevos/modificados sin errores | PASS (2026-08-23) |

## Correcciones post-implementación

| Fecha | Corrección | Motivo |
|---|---|---|
| 2026-08-23 | `ProjectIndicatorsService.getByProject` consulta ahora el histórico completo de `time_entries` (`totalLoggedHours`) separado de la ventana de 6 semanas (`dailyHours`) que solo alimenta el gráfico de carga | Las horas consumidas totales (6.6) usaban la lista recortada a las últimas 6 semanas, subestimando el esfuerzo en proyectos con registros antiguos; `resolveConsumedHours` consume la suma histórica y el fallback roll-up se mantiene intacto. Verificado sin errores TS/ESLint en los archivos de la feature. |

## Pendiente manual (requiere entorno con datos)

- [ ] Proyecto con time_entries → horas consumidas reflejan registros semanales del gráfico.
- [ ] Tarea bloqueada + hito vencido → semáforo sube a Medium/High y salud a at_risk/critical.
- [ ] Rol Client/Intermediary sobre proyecto ajeno → redirect a `/unauthorized`.
