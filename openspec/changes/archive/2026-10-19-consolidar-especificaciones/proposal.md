# Proposal: Consolidar las especificaciones en capacidades por dominio

## Why

`openspec/specs/` acumuló **9 carpetas** creadas una por cada nuevo tema de
change, y sus contenidos se solapan o mezclan asuntos distintos. El caso extremo
es `todo-tasks`: 290 líneas y 17 requisitos que cubren a la vez el modelo de
datos, la validación Zod, los filtros, el layout de viewport, el sistema de
color y tipografía, los diálogos shadcn, el movimiento y los selectores de test.
`openspec validate --specs` ya lo señala: 8 requisitos superan los 500
caracteres de descripción. Leer el conjunto exige recorrer nueve archivos sin
índice ni criterio común, y navegar exige abrirlos todos.

El modelo de OpenSpec impone `specs/<capability>/spec.md` (o el anidado
`specs/<area>/<capability>/spec.md`); un `spec.md` en la raíz de `specs/` se
ignora al validar y archivar. Por tanto la consolidación en un **único archivo
fuente** no es viable, pero sí lo es re-slicar las capacidades por dominio y
publicar además un índice legible **generado**.

## What Changes

- **9 → 6 capacidades por dominio**, con los requisitos movidos verbatim:
  - `todo-tasks`: dominio de tareas (modelo, ciclo de vida, validación,
    aislamiento por usuario, semántica de listado/filtro/búsqueda).
  - `task-ui` (**nueva**): la pantalla `/tareas` (CRUD, formulario accesible,
    filtros y buscador, titular del día, tarjetas, layout, shadcn, superficies,
    movimiento, sistema de tipo/color y selectores de test).
  - `identity` (fusiona `user-auth` + `user-auth-ui`): autenticación, sesión,
    rutas protegidas y navbar/menú de sesión.
  - `mcp` (fusiona `mcp-tasks` + `mcp-tokens`): endpoint, tools, validación y
    ciclo de vida de los tokens.
  - `public-site` (fusiona `landing-page` + `site-footer` + `architecture-docs`):
    landing, pie global y documentación pública de arquitectura.
  - `platform`: entornos Turso test/prod y esquema en deploy (sin cambios).
- **Se retiran** 8 carpetas (`user-auth/`, `user-auth-ui/`, `mcp-tasks/`,
  `mcp-tokens/`, `landing-page/`, `site-footer/`, `architecture-docs/`,
  `turso-environments/`) y el `specs/.gitkeep` ya innecesario.
- **Consolidaciones de contenido** (sin cambio de comportamiento observable):
  se funden el requisito de footer de `todo-tasks` con el pie global; el enlace
  de documentación de la navbar con el de la landing; el Bearer de `user-auth`
  con el endpoint MCP de `mcp-tasks`; y se retira el requisito de proceso
  "Pulido validado con Playwright y guidelines", cuya política vive en
  `AGENTS.md` §4.
- **Se parten** los requisitos con descripción >500 caracteres en requisitos de
  una sola conducta, para que la validación deje de marcarlos.
- **`scripts/sync-especificaciones.mjs`** genera `docs/especificaciones.md`
  (índice + contenido completo de los 6 specs) de forma idempotente, y se
  engancha a `predev`/`prebuild` más un script `specs:doc`.
- **Gobernanza**: `openspec/config.yaml` declara el inventario cerrado de
  capacidades y la regla de no crear una carpeta por change; `AGENTS.md` y
  `requirement.md` apuntan al índice generado.

## Capabilities

### New Capabilities

- `task-ui`: pantalla `/tareas` y sistema de componentes, tipografía, color y
  movimiento de la app.

### Modified Capabilities

- `todo-tasks`: se reduce al dominio (datos, validación, aislamiento,
  listado/filtro) y cede sus requisitos de UI a `task-ui`.
- `platform`: mismo contenido que `turso-environments` bajo el nombre de la
  capacidad de plataforma.

### Removed Capabilities

- `user-auth` y `user-auth-ui` → sus requisitos viven en `identity`.
- `mcp-tasks` y `mcp-tokens` → sus requisitos viven en `mcp`.
- `landing-page`, `site-footer` y `architecture-docs` → sus requisitos viven en
  `public-site`.
- `turso-environments` → renombrada a `platform`.

## Impact

- **Estructura**: `openspec/specs/**` (6 archivos en lugar de 9), nuevo
  `openspec/specs/task-ui/`.
- **Gobernanza**: `openspec/config.yaml`, `AGENTS.md`, `requirement.md`.
- **Tooling**: `scripts/sync-especificaciones.mjs` y `package.json`
  (`predev`, `prebuild`, `specs:doc`); `docs/especificaciones.md` generado.
- **Sin cambios** en código de aplicación, base de datos, API, Server Actions ni
  tools MCP: es reorganización documental. Los deltas de changes futuros
  apuntan a los nombres nuevos; `openspec/changes/archive/**` no se toca.
