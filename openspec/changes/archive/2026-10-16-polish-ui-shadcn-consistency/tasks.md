# Tasks

## 1. Auditoría UI desktop/móvil

- [x] 1.1 Auditar con `playwright-cli` en 1440px y 390px (`open`, `snapshot`, `find "Editar|Eliminar|Guardar"`, `screenshot` antes) y registrar botones no-shadcn, overflows y dianas <44px; verificar con snapshots y PNG guardados en `/tmp/opencode`.
- [x] 1.2 Revisar `components/task-item.tsx`, `task-form.tsx`, `task-filters.tsx`, `ui/button.tsx` y `app/globals.css` contra `web-design-guidelines` (fetch remoto) y emitir informe `file:line` de bloqueantes; verificar con informe incluido en el PR/cambio.

## 2. Botón shadcn reutilizable

- [x] 2.1 Extender `buttonVariants` en `components/ui/button.tsx` con `destructive` (sólida `bg-destructive text-ground hover:bg-destructive/90`) y documentar mapa variante/intención, sin romper API (`variant`, `size`, `asChild`); verificar con `npx tsc --noEmit` y render de variantes en story/snapshot local.
- [x] 2.2 Añadir/actualizar test Vitest de `Button` (variantes `default/ghost/destructive`, `size sm`, foco visible, `disabled:opacity-50`, `asChild`) y verificar con `npm test -- components/ui/button` en verde.

## 3. Migración de acciones a Button

- [x] 3.1 Migrar Editar/Guardar/Eliminar en `components/task-item.tsx` a `Button` (Editar `ghost/sm`, Guardar `default/sm` + `Spinner data-icon` en pending, Eliminar `ghost/sm` + `text-destructive`) conservando `data-testid`, `aria-label`, `disabled` y foco 2px; verificar con `npx tsc --noEmit` y snapshot `playwright-cli` que muestra alturas/radio/tipografía unificadas.
- [x] 3.2 Migrar botones del `AlertDialog` (Cancelar `outline`, Confirmar `destructive` vía `asChild` donde aplique) y alinear `TaskForm`/`TaskFilters` a las mismas variantes; verificar con E2E de borrado (abrir, Escape/Cancelar no borra, Confirmar borra) en local.
- [x] 3.3 Actualizar/añadir tests Vitest de `task-item.test.tsx` (editar, guardar, eliminar con `Button`, sin `window.confirm`) y verificar con `npm test -- task-item` en verde.

## 4. Pulido responsive y verificación final

- [x] 4.1 Ajustar bloque de acciones a `flex-wrap gap-2` con táctil `min-h-11` en móvil, sin `space-x/y`, sin `overflow-x` y sin recorte de foco en contenedores con scroll; verificar con `playwright-cli` en 390px (`snapshot --boxes`, screenshot después) sin scroll horizontal.
- [x] 4.2 Revalidar guidelines (foco, contraste AA, jerarquía) tras los cambios y corregir o justificar excepciones; verificar con segundo informe `file:line` sin bloqueantes abiertos.
- [x] 4.3 Ejecutar verificación integrada `npm test` + `npx playwright test` y comparar screenshots antes/después desktop/móvil; verificar con ambas suites en verde y `data-testid` intactos.
