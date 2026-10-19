# Tasks: Consolidar las especificaciones en capacidades por dominio

## 1. Inventario y plan

- [x] 1.1 Crear `openspec/changes/consolidar-especificaciones/` con `skip_specs: true` en `.openspec.yaml`, `proposal.md` y `design.md`, y verificar con `npx openspec validate consolidar-especificaciones --strict`.
- [x] 1.2 Fijar el mapa capacidad → requisitos (6 capacidades) y las cuatro consolidaciones más la retirada en `design.md`, verificando que las 9 carpetas de origen quedan cubiertas una a una.

## 2. Reasignar requisitos a las seis capacidades

- [x] 2.1 `todo-tasks`: dejar solo dominio (modelo, ciclo de `fechaCulminada`, validación, aislamiento por usuario y semántica de listado), verificando que la spec no menciona ya componentes ni estilos de UI.
- [x] 2.2 Crear `task-ui` con los requisitos de pantalla, formulario, filtros/buscador, titular, tarjetas, layout, shadcn, tipografía, color y movimiento, verificando que cada requisito tiene al menos un escenario `#### Scenario:`.
- [x] 2.3 Crear `identity` con `user-auth` + `user-auth-ui` fusionados, verificando que el modal, la navbar, las rutas protegidas y el retorno tras autenticarse están presentes.
- [x] 2.4 Crear `mcp` con `mcp-tasks` + `mcp-tokens` fusionados, verificando que el Bearer de `user-auth` queda cubierto por el requisito de endpoint sin pérdida de escenarios.
- [x] 2.5 Crear `public-site` con `landing-page` + `site-footer` + `architecture-docs`, verificando que el enlace a la documentación (navbar y landing) y el pie global quedan como un único requisito y dos requisitos respectivamente.
- [x] 2.6 Crear `platform` con el contenido de `turso-environments`, verificando con `git diff` que no cambia ningún requisito.
- [x] 2.7 Retirar las 8 carpetas antiguas y `openspec/specs/.gitkeep` con `git rm`, y verificar con `npx openspec list --specs` que el árbol queda en 6 capacidades.

## 3. Eliminar los avisos de requisitos largos

- [x] 3.1 Partir en requisitos de una conducta los 8 requisitos con descripción >500 caracteres, verificando con un conteo que ninguno supera el límite.

## 4. Índice legible generado

- [x] 4.1 Escribir `scripts/sync-especificaciones.mjs` (índice con capacidades, requisitos y escenarios) y verificar que `node scripts/sync-especificaciones.mjs` genera `docs/especificaciones.md` y que repetirlo es idempotente.
- [x] 4.2 Enganchar el generador a `predev`/`prebuild` y añadir el script `specs:doc`, verificando con `npm run specs:doc` que el documento se regenera sin errores.

## 5. Gobernanza

- [x] 5.1 Declarar en `openspec/config.yaml` el contexto del proyecto, el inventario cerrado de capacidades, las reglas del artefacto `specs` y la guía de `apply`/`archive`.
- [x] 5.2 Actualizar `AGENTS.md` §1 y §2 con la fuente de especificaciones, el índice generado y la regla de no crear una capacidad por change.
- [x] 5.3 Apuntar `requirement.md` §6 al inventario consolidado y a `docs/especificaciones.md`.
- [x] 5.4 Corregir en `docs/arquitectura.md` las referencias a capacidades retiradas (`turso-environments`, `mcp-tasks`, `mcp-tokens`, `user-auth-ui`).

## 6. Verificación final

- [x] 6.1 `npx openspec validate --specs --strict` sin fallos ni avisos de requisitos largos (6 capacidades, 0 fallos).
- [x] 6.2 `npx openspec validate consolidar-especificaciones --strict` en verde con `skip_specs: true`.
- [x] 6.3 `npm run lint` y `npm run typecheck` en verde tras añadir el script.
- [x] 6.4 `node scripts/sync-arquitectura.mjs --skip-if-missing` y `node scripts/sync-especificaciones.mjs --skip-if-missing` salen 0, de modo que `predev`/`prebuild` no se rompen.
- [x] 6.5 Verificado con `grep` que fuera de `openspec/changes/archive/` no queda ninguna referencia a las capacidades retiradas.
