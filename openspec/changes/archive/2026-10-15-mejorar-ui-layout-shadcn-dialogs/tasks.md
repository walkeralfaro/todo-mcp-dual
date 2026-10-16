# Tasks

## 1. Primitivas shadcn (skill `shadcn`)

- [x] 1.1 Generar `components/ui/select.tsx` y `components/ui/alert-dialog.tsx` con el skill `shadcn` (instalar `@radix-ui/react-select` y `@radix-ui/react-alert-dialog`) y verificar `npx tsc --noEmit` pasa y los archivos existen.
- [x] 1.2 Verificar accesibilidad base de las primitivas (foco visible 2px, navegación por teclado Enter/Escape, sin `window.alert/confirm`) con inspección manual + `npm test` en verde.

## 2. Desplegable de estado y diálogo de borrado

- [x] 2.1 Migrar el cambio de estado de `TaskItem` a `Select` shadcn conservando `data-testid="status-select"` y el flujo `updateTaskAction` + `router.refresh()`, y verificar con test Vitest/RTL que elegir EN_PROCESO persiste y `npx playwright test -g "cambiar estado|status"` pasa.
- [x] 2.2 Reemplazar `window.confirm` por `AlertDialog` shadcn (Cancelar/Eliminar, Escape cierra sin borrar, foco vuelve al trigger) conservando `data-testid="delete-btn"`, y verificar que confirmar elimina, cancelar conserva, y `grep -rn "window.confirm\|window.alert" components/ app/` no devuelve resultados.
- [x] 2.3 Añadir/actualizar tests Vitest del diálogo (confirmar elimina, cancelar/Escape no elimina) y verificar `npm test` en verde.

## 3. Layout viewport-first con tareas prioritarias

- [x] 3.1 Migrar `app/layout.tsx` + `app/page.tsx` a contenedor `h-dvh overflow-hidden`, grid `lg:grid-cols-[minmax(0,1fr)_340px]`, lista en región `overflow-y-auto` y panel lateral con formulario + filtros, conservando `data-testid` y orden accesible, y verificar en desktop 1440×900 que la primera tarea es visible sin scroll global y solo la lista scrollea.
- [x] 3.2 Compactar móvil (`<lg`) a una columna con scroll de documento y formulario no dominante, y verificar a 390px que titular, formulario, filtros y lista son alcanzables sin solapes.
- [x] 3.3 Verificar contraste AA, foco visible y `aria-live` del conteo tras el layout, y documentar capturas o checklist en el PR.

## 4. Integración y regresión

- [x] 4.1 Ejecutar `npm test` completo y `npx playwright test` sin modificar `e2e/todo.spec.ts`, y verificar ambos en verde con `data-testid` intactos.
- [x] 4.2 Verificar prohibición de nativos en toda la app (`grep` anterior vacío) y que el E2E con diálogos nativos auto-descartados pasa solo vía `AlertDialog`.
