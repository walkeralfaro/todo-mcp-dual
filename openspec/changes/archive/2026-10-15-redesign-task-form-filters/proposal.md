# Proposal

## Why

Los componentes de creación (`components/task-form.tsx`) y filtrado (`components/task-filters.tsx`) funcionan pero no son accesibles ni jerárquicos: el campo descripción no tiene etiqueta, los errores no se anuncian a lectores de pantalla, los filtros usan botones sueltos con `aria-pressed` manual y la búsqueda dispara navegación en cada tecla sin debounce. Hay que rediseñarlos con componentes accesibles shadcn, foco visible claro y jerarquía tipográfica legible, sin romper flujos ni `data-testid` existentes.

## What Changes

- Migrar `TaskForm` a composición shadcn (`FieldGroup` + `Field` + `FieldLabel` + `Input` + `Button` con `Spinner`): etiqueta visible para título y descripción, `aria-invalid` + `aria-describedby`, error con `role="alert"` / `aria-live="polite"`, foco `focus-visible:ring`, botón con estado pendiente accesible.
- Migrar `TaskFilters` a `ToggleGroup` single-select para estado (TODAS/PENDIENTE/EN_PROCESO/COMPLETADA) + campo de búsqueda con `InputGroup` (icono, botón limpiar con `aria-label`), `role="search"`, debounce (~300 ms) y `aria-live` en conteo de resultados.
- Definir jerarquía de fuentes: título de sección semibold 18–20px `text-balance`, etiquetas 14px medium, cuerpo/inputs 16px, ayuda/error 13–14px; respetar tokens existentes (`ground`/`surface`/`ink`/`muted`/`accent`) y acento verde solo en acción primaria y COMPLETADA.
- Instalar base shadcn mínima (`components.json`, `button`, `input`, `label`/`field`, `toggle-group`, `spinner`) y adaptar tokens Tailwind v4 sin cambiar paleta.
- Conservar todos los `data-testid` (`new-title`, `new-desc`, `create-btn`, `filter-*`, `search`) y los flujos crear/filtrar/buscar para que el E2E actual pase sin modificaciones.

## Capabilities

### New Capabilities

— Ninguna. Se reutiliza la capacidad existente; no se introduce comportamiento de dominio nuevo.

### Modified Capabilities

- `todo-tasks`: los REQUIREMENTS de CRUD/creación, listado con filtros/búsqueda y sistema de tipo/color se amplían con requisitos de accesibilidad (etiquetas, anuncios de error/resultados, foco visible, jerarquía) y comportamiento de búsqueda con debounce. Requiere delta spec.

## Impact

- Afectado: `components/task-form.tsx`, `components/task-filters.tsx`, `app/globals.css` (tokens/focus), `components.json` + `components/ui/*` (nuevo), `package.json` (deps shadcn: `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/*`, `lucide-react`).
- No cambia: modelo Prisma, Server Actions, validación Zod, rutas MCP (`/api/mcp`), ordenado por `fechaCreacion` desc.
- Riesgo: primera adopción de shadcn en el repo; se mitiga con set mínimo de componentes y sin cambio de paleta/tipografía base.
