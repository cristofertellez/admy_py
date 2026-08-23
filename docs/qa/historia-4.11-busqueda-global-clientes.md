# QA — Historia 4.11: Búsqueda Global de Clientes

Historia: BACKLOG.md → Épica 4 / Historia 4.11 (Búsqueda Global de Clientes)

Fecha: 2026-08-22

---

## 1. Alcance implementado

| Requisito | Implementación |
| --- | --- |
| Buscar por nombre | `lower(contact_name) LIKE '%term%'` en `ClientsService.list` y en la consulta de clientes de `globalSearch`. |
| Buscar por empresa | `lower(company_name) LIKE ?` en ambos backends. |
| Buscar por correo | `lower(email) LIKE ?` en ambos backends. |
| Buscar por teléfono | `lower(phone) LIKE ?` añadido en esta historia a `features/clients/clients.service.ts` y `actions/search.ts`. El resultado muestra el teléfono como subtítulo cuando el cliente no tiene email. |
| Búsqueda instantánea | Lista de clientes: input del `DataTable` con debounce de 400 ms sincronizado a `?search=` vía `router.replace` (Server Component reconsulta). Diálogo global (`GlobalSearchDialog`) y página `/dashboard/search`: debounce real de 300 ms con `useDebounce` + `useEffect`, guard de respuesta obsoleta por término (`latestTermRef`) y estados de carga/vacío/error diferenciados. |
| Resultados rápidos | `globalSearch` limita a 5 resultados por entidad con consultas paralelas (`Promise.allSettled`); los resultados enlazan directo a la ficha del cliente (`/dashboard/clients/{id}`). |
| Coincidencias parciales | Patrón `%term%` en los cuatro campos; mínimo 2 caracteres para disparar la búsqueda global. |
| Rendimiento | Debounce (300–400 ms) evita una petición por tecla; guard descarta respuestas fuera de orden; `LIMIT` en servidor; un solo round-trip por término estable. |

## 2. Arquitectura

```
actions/search.ts             server action globalSearch: auth + clientScope/projectScope + LIKE multi-campo
features/clients/service      ClientsService.list: search param + clientScope (RBAC por fila)
app/dashboard/clients/page    Server Component: lee ?search= y delega en ClientsService
app/dashboard/clients/table   debounce 400 ms → URL state (?search=)
components/shared/global-search-dialog
app/dashboard/search/page     debounce 300 ms + startTransition + guard de término obsoleto
hooks/use-debounce            utilidad compartida de debounce
```

La autorización se aplica en la capa de datos: toda búsqueda de clientes pasa por `clientScope("id")` (Developer sin filtro, Intermediary solo sus clientes asignados, Client solo su propio cliente) junto con `is_active = 1 AND deleted_at IS NULL`. Nunca se confía en permisos del frontend.

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS |
| `npm run lint` sin errores ESLint | PASS |

## 4. Checklist manual

### Escenario A — Coincidencias parciales (rol Developer)

- [ ] Buscar prefijo de empresa ("Ac" para "Acme") → aparece el cliente desde la tabla, el diálogo global y `/dashboard/search`.
- [ ] Buscar nombre de contacto parcial → el cliente aparece aunque no coincida la empresa.
- [ ] Buscar fragmento de correo (dominio, p. ej. "@acme") → coincidencia por email.
- [ ] Buscar dígitos intermedios de un teléfono → coincidencia por phone en tabla, diálogo y página de búsqueda.
- [ ] Términos en mayúsculas/minúsculas devuelven los mismos resultados (búsqueda case-insensitive).
- [ ] Menos de 2 caracteres en el buscador global → no se dispara ninguna consulta.

### Escenario B — Búsqueda instantánea y rendimiento

- [ ] Escribir rápido en el diálogo global → una sola llamada al servidor tras la pausa de 300 ms (no una por tecla).
- [ ] Corregir el término rápidamente → solo se pinta el resultado del último término (guard de respuestas obsoletas).
- [ ] Durante la consulta → indicador "Searching..." visible; sin resultados → estado vacío con el término consultado.
- [ ] Lista de clientes: escribir en la barra actualiza la URL (`?search=`) y el resultado paginado sin recargar la página completa.

### Escenario C — Autorización por rol

- [ ] Intermediary: buscar por datos de un cliente NO asignado → sin resultados; sus propios clientes sí aparecen.
- [ ] Client: buscar → solo su propio cliente es visible.
- [ ] Cliente archivado (`deleted_at` o `is_active = 0`) → nunca aparece en resultados de búsqueda global ni en la lista.

### Escenario D — Errores

- [ ] Fallo del servidor durante la búsqueda → mensaje amigable en el diálogo/página, sin stack traces.

## 5. Notas

1. La búsqueda por teléfono usa `lower(phone)` por consistencia con los demás campos; el patrón `%term%` cubre coincidencias intermedias de dígitos.
2. Los índices B-tree existentes no aplican a `LIKE '%…%'`; con el volumen actual el LIMIT + debouce es suficiente. Si crece el dataset, evaluar FTS5 en Turso como camino de optimización futuro.
3. El diálogo global busca también proyectos, tareas e hitos (Historia 6.16); esta historia garantiza que los clientes incluyan los cuatro campos del requisito.
