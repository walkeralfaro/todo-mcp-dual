# Design

## Context

Ver `proposal.md` (Why). Estado actual: `components/ui/button.tsx` (cva + `default/secondary/outline/ghost`, tamaños `default/sm/lg/icon`) ya se usa en `TaskForm` (Crear) y `TaskFilters` (limpiar búsqueda), pero `components/task-item.tsx` usa `<button>` crudos para Editar (`px-1 py-2 text-muted hover:text-ink`), Guardar (`bg-accent px-4 py-2`) y Eliminar (`text-destructive`), y `AlertDialogAction` lleva `bg-destructive` manual. No hay variante `destructive` en `buttonVariants`. Layout desktop ya es `100dvh` con scroll propio; falta verificar 1440px vs 390px con `playwright-cli` y `web-design-guidelines`. Restricciones: RSC (`"use client"` donde hay estado), Tailwind v4 (`app/globals.css`), sin `space-x/y`, usar `gap-*`, `size-*`, `cn()`, tokens semánticos, `data-testid` intactos. Ver specs delta (`specs/todo-tasks/spec.md`).

## Goals / Non-Goals

**Goals:**
- Unificar todas las acciones sobre `Button` shadcn con mapa variante/intención estable y reutilizable.
- Extender `buttonVariants` con `destructive` (y pulir `ghost`/`outline` si la auditoría lo pide) sin romper API.
- Dejar pulido desktop/móvil verificado (sin overflow-x, táctil ≥44px en móvil, foco completo).

**Non-Goals:**
- Cambiar flujos, validación, Prisma/MCP o el tema "turno de noche".
- Crear design system page ni nuevos primitivos (Card, Dialog, etc.).
- Reescribir `TaskFilters`/`TaskForm` más allá de alinear variantes.

## Decisions

- **Auditoría primero con `playwright-cli` en 1440px y 390px** (`open`, `snapshot`, `find "Eliminar|Editar|Guardar"`, `screenshot` antes/después). Alternativa: solo inspección estática — descartada porque no detecta overflow, recortes de foco ni dianas táctiles. Rationale: evidencia visual + snapshot es barato y repetible.
- **Guidelines vía fetch remoto** (`https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`) + informe `file:line` sobre `task-item.tsx`, `task-form.tsx`, `task-filters.tsx`, `button.tsx`, `globals.css`. Alternativa: revisión ad-hoc — descartada por inconsistente. Solo se corrigen bloqueantes; el resto se documenta.
- **Mapeo de botones:** Editar → `Button variant="ghost" size="sm"`; Guardar → `Button variant="default" size="sm"` (+ `Spinner data-icon` en pending como ya hace Crear); Eliminar en fila → `Button variant="ghost" size="sm"` con `text-destructive` (o variante `destructive-ghost` si se crea); Cancelar diálogo → `Button variant="outline"` (vía `AlertDialogCancel asChild` si aplica); Confirmar borrado → `Button variant="destructive"` (vía `AlertDialogAction asChild`). Alternativa: variante `destructive` sólida en ambos — descartada en fila por peso visual excesivo junto al Select.
- **Extender `buttonVariants` con `destructive: "bg-destructive text-ground hover:bg-destructive/90"`** (y opcional `destructive-ghost`) siguiendo `rules/styling.md` y `composition.md` shadcn (sin `z-index` manual, sin `dark:` crudo, iconos con `data-icon` sin `size-4`). Alternativa: clases sueltas por sitio — descartada porque reintroduce la incoherencia que motiva el cambio.
- **Móvil:** bloque de acciones en `flex-wrap` con `gap-2`, altura mínima táctil (`min-h-11` / `size` coherente), sin cambiar grid desktop. Verificar con `playwright-cli resize`/`open --mobile` y `snapshot --boxes` si hay dudas de solape.

## Risks / Trade-offs

- [Riesgo] Cambiar `<button>` por `Button` altera especificidad y puede mover estados `disabled`/foco → Mitigación: conservar `data-testid`/`aria-label`/`disabled`, comparar screenshots antes/después y pasar E2E sin tocar specs de test.
- [Riesgo] `destructive` sobre fondo elevado no llega a AA → Mitigación: medir contraste y ajustar a `text-destructive` sobre `ghost` o sólido con `text-ground` según superficie; registrar excepción si guidelines lo permiten.
- [Riesgo] Foco recortado en contenedores con scroll (`overflow-y-auto`) → Mitigación: anillo `focus-visible:ring-2` con offset interno, verificar por teclado en ambos viewports.
- [Trade-off] Unificar alturas puede hacer la tarjeta ligeramente más alta en móvil → Aceptado a cambio de dianas ≥44px y coherencia.

## Migration Plan

- Sin migración: cambio visual compatible. Rollback: revert de `task-item.tsx` + `button.tsx` (ningún cambio de esquema ni API pública).
- Orden: auditoría → `button.tsx` → `task-item.tsx` → alineación menor form/filters → re-snapshot + Vitest + Playwright.

## Open Questions

- Ninguna que bloquee specs o tareas. Detalle menor a confirmar en implementación: tono exacto de Eliminar en fila (ghost + `text-destructive` vs nueva `destructive-ghost`) según contraste medido.
