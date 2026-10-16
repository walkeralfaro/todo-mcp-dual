# Design

## Context

Estado actual (verificado en código): `components/task-form.tsx` usa `<form>` + 2 `<input>` sin shadcn, solo el título tiene `<label>`; el error es `<p>` sin `role`/`aria-live`. `components/task-filters.tsx` usa 4 `<button>` con `aria-pressed` manual + `<input defaultValue>` que hace `router.push` en cada `onChange` (sin debounce). `app/globals.css` define tokens (`ground #ebe5e3`, `surface`, `ink #2b2622`, `muted`, `accent #0f7d45`) y un `:focus-visible` global de 2px, pero los componentes no declaran `focus-visible:ring` propio. No hay `components.json` ni `components/ui/*` (ver `package.json`: sin `clsx`, `tailwind-merge`, radix ni `lucide-react`). Los specs `todo-tasks` exigen conservar flujos y `data-testid` para que `e2e/todo.spec.ts` pase sin cambios. Ver `proposal.md` para motivación y `specs/todo-tasks/spec.md` para requisitos.

## Goals / Non-Goals

**Goals:**
- Formulario y filtros accesibles por teclado y lector de pantalla con shadcn, cumpliendo Vercel Web Interface Guidelines (labels, foco, anuncios).
- Jerarquía tipográfica clara sin cambiar paleta ni Stack Sans.
- Búsqueda usable (debounce + limpiar + anuncio de resultados) manteniendo estado en URL.

**Non-Goals:**
- No se toca modelo Prisma, Server Actions, validación Zod ni MCP.
- No se rediseña `task-item.tsx`, listado, titular del día ni página completa.
- No se cambia paleta, ni se añade dark mode, i18n adicional o virtualización.

## Decisions

**1. Base shadcn mínima con `npx shadcn@latest init + add button input label field toggle-group spinner`**
- Por qué: el repo no tiene shadcn; instalar solo lo necesario limita riesgo y sigue la regla "use existing components first". `FieldGroup`+`Field` resuelve layout y `data-invalid`/`aria-invalid`; `ToggleGroup` resuelve el grupo 2–7 opciones mejor que botones sueltos; `Spinner` + `data-icon` resuelve pendiente accesible.
- Alternativas: (a) CSS artesanal con ARIA manual — descartado, duplica lo que radix ya resuelve y es frágil; (b) instalar `add --all` — descartado, sobredimensionado para dos componentes.
- Tokens: mapear `ground/surface/ink/muted/accent` a variables shadcn en `globals.css` (Tailwind v4 `@theme inline`), sin introducir colores crudos; respetar `aliases` del proyecto (`@/components/ui`).

**2. `TaskForm` = `FieldGroup > Field > FieldLabel + Input + FieldDescription/FieldError`**
- Título (`new-title`, `required`, `maxLength 100`, `autocomplete="off"`, `aria-describedby`) y descripción (`new-desc`, `maxLength 500`, etiqueta visible "Descripción (opcional)"). Error de Server Action en `FieldError` con `role="alert"`, foco al primer campo inválido en submit. Botón `Button variant="default"` con `Spinner data-icon="inline-start"` + `aria-busy` durante `useTransition`.
- Alternativa `Textarea` para descripción: se mantiene `Input` para no romper `data-testid`/E2E; documentar como mejora futura.

**3. `TaskFilters` = `ToggleGroup type="single"` + `InputGroup` search**
- `ToggleGroup` con `aria-label="Filtrar por estado"`, 4 `ToggleGroupItem` (`filter-TODAS` etc.), valor sincronizado desde `searchParams.estado`; mantiene URL `?estado=` (vacío = TODAS). `role="search"` alrededor del buscador, `InputGroupInput` con `aria-label="Buscar tareas"`, icono `Search` `aria-hidden`, botón limpiar (`X`, `aria-label="Limpiar búsqueda"`) solo cuando hay texto.
- Debounce 300 ms con `useRef` timer + `router.push`; el input es controlado localmente y sincronizado desde `q` inicial para evitar navegación por tecla y renders caros (guideline: prefer uncontrolled / cheap controlled). Conteo con `aria-live="polite"`.
- Alternativa segment `Select`: descartada, los 4 estados caben en línea y el toggle es más descubrible; `Select` ocultaría opciones.

**4. Jerarquía y foco**
- Formulario en `Card`/`surface`: título `text-[19px] font-semibold text-balance`, `FieldLabel text-sm font-medium`, ayuda/error `text-[13px]`, inputs `text-base`. Filtros: etiqueta de grupo `sr-only` + items `text-[15px]`, activo `font-medium text-ink` con fondo `surface`/subrayado, inactivo `text-muted` pero con contraste AA. Foco: `focus-visible:ring-2 ring-accent ring-offset-2 ring-offset-ground` en Button/Input/ToggleItem; nunca `outline-none` sin reemplazo; `:focus-within` en `InputGroup`.
- Tipografía: `…` en placeholders ("Buscar por título o descripción…"), `tabular-nums` en conteo, `min-w-0` + `truncate` donde aplique.

## Risks / Trade-offs

- [Primera adopción shadcn mete radix + tailwind-merge] → Mitigación: set mínimo, `add --dry-run/--diff` antes de aceptar, revisar imports con alias `@/`.
- [Debounce cambia timing del E2E de búsqueda] → Mitigación: conservar `data-testid="search"` y valor final en URL; E2E debe esperar debounce (300 ms) o `searchParams`; test con `playwright` valida.
- [`ToggleGroup` single no permite deseleccionar a TODAS con clic repetido] → Mitigación: TODAS es item explícito (comportamiento actual preservado).
- [Verde accent sobre ground puede fallar AA en texto pequeño] → Mitigación: verde solo en botón primario blanco y marca COMPLETADA; foco usa anillo verde de 2px (no texto); verificar con medidor de contraste.

## Migration Plan

1. `npx shadcn@latest init` (Tailwind v4, alias `@/`) + `add button input label field toggle-group spinner` con `--dry-run`.
2. Reescribir `task-form.tsx` y `task-filters.tsx` conservando `data-testid`.
3. Ajustar `globals.css` (focus tokens, jerarquía) sin cambiar paleta.
4. `npm test` (vitest) + `npx playwright test e2e/todo.spec.ts`; rollback: revert de los dos componentes (cambio UI puro, sin migración de datos).

## Open Questions

- Ninguna que bloquee specs o tareas. Seguimiento menor para apply: ¿descripción pasa a `Textarea` en un cambio posterior? (por defecto no, para no romper E2E).
