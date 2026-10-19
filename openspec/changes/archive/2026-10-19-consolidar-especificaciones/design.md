# Design: Consolidación por dominio del árbol de especificaciones

## Context

Ver `proposal.md` — Why. Restricción determinante verificada contra
`@fission-ai/openspec@1.14.0`:

- `discoverSpecFiles` (`dist/utils/spec-discovery.js`) recorre
  `specs/**/spec.md` y exige al menos un segmento de carpeta; un `spec.md` en la
  raíz de `specs/` se **ignora** y la validación lo reporta (issue #1385).
- El layout anidado `specs/<area>/<capability>/spec.md` sí se soporta (#1353),
  pero no reduce el número de documentos fuente.
- El merge al archivar es por ruta exacta: `specs/<capability-path>/spec.md` →
  `openspec/specs/<capability-path>/spec.md`.

Conclusión: la fuente de verdad debe seguir siendo una carpeta por capacidad; el
"documento único" pedido se resuelve como **artefacto derivado**.

## Goals / Non-Goals

- **Goal**: 6 capacidades de un solo tema, cada una legible de una sentada, sin
  ningún requisito >500 caracteres.
- **Goal**: un índice único legible (`docs/especificaciones.md`) generado desde
  los specs, sin edición manual.
- **Goal**: impedir que vuelva a crecer una carpeta por change.
- **Non-Goal**: cambiar comportamiento, código, esquema de datos o contratos.
- **Non-Goal**: reescribir la historia en `openspec/changes/archive/**`.

## Decisions

### D1. Seis capacidades por dominio

| Capacidad | Origen | Requisitos |
|---|---|---|
| `todo-tasks` | `todo-tasks` (dominio) + aislamiento de `user-auth` | 5 |
| `task-ui` (nueva) | `todo-tasks` (UI, diseño, a11y, tests) | 17 |
| `identity` | `user-auth` + `user-auth-ui` | 12 |
| `mcp` | `mcp-tasks` + `mcp-tokens` | 10 |
| `public-site` | `landing-page` + `site-footer` + `architecture-docs` | 11 |
| `platform` | `turso-environments` (renombrada) | 6 |

Total: **61 requisitos** (los 57 originales, +8 por partir requisitos largos y −4
por las consolidaciones y la retirada de la sección D3).

**Por qué por dominio y no por "pantalla" o "change":** una capacidad debe
poseer requisitos que evolucionan juntos. `task-ui` agrupa todo lo que se toca
al rediseñar la pantalla (formulario, listado, filtros, componentes, color,
movimiento), y `todo-tasks` lo que se toca al cambiar reglas de tarea. Esa
frontera es la que evita que un cambio de estilo obligue a editar la spec del
dominio.

**Alternativas descartadas:** un único `spec.md` (rompe validación y archivo);
4 capacidades gruesas (recrea specs de 300+ líneas); layout anidado por áreas
(no reduce documentos).

### D2. Split de requisitos largos en lugar de resumen

Los 8 requisitos >500 caracteres se parten en requisitos de una conducta con sus
propios escenarios, en vez de acortar el texto. Un requisito largo suele
describir 2–3 conductas independientes; partir conserva toda la información y
hace cada bloque verificable por separado. Ejemplos:

- `Listado con filtros, búsqueda y orden` → `Listado filtrado y ordenado por
  usuario` (semántica de datos, en `todo-tasks`) + `Filtros y buscador
  accesibles` (presentación y a11y, en `task-ui`).
- `CRUD completo desde la UI` → `CRUD completo desde la UI` + `Formulario de
  creación con errores anunciados`.
- `Sistema sobrio de tipo y color` → `Sistema sobrio de tipo y color con acento
  único` + `Jerarquía tipográfica y foco visible`.
- `Titular del día` → `Titular del día con cifra de pendientes` + `Pulso neón al
  descontar una tarea`.
- `Flujos y selectores de test estables` → `Flujos y selectores de test
  estables` + `Specs E2E apuntan a /tareas`.
- `Botones de autenticación en el header` → `Navbar compartida con acciones de
  sesión` + `Controles del header accesibles en todo ancho` (en `identity`).
- `Enlace a la documentación de arquitectura` → `Enlace a la documentación de
  arquitectura` + `Presentación y accesibilidad del enlace de documentación`
  (en `public-site`, ya fusionados navbar y landing).
- `Layout desktop a altura de viewport` → `Layout desktop a altura de viewport
  con tareas prioritarias` + `Apilado y dianas táctiles en móvil` (en `task-ui`).

Se normalizan además los encabezados de escenario a `#### Scenario: <nombre>`
(algunos usaban `#### <nombre>`) por consistencia de lectura y de parseo.

### D3. Cuatro consolidaciones y una retirada

1. **Footer**: el requisito de `todo-tasks` ("Footer al borde inferior sin
   sticky") y `site-footer` describían el mismo pie; se funden en `public-site →
   Pie de página global con crédito al fondo`, conservando los escenarios de
   ambos (no cubrir el foco, final del documento, tres páginas).
2. **Enlace de documentación**: `user-auth-ui → Enlace de documentación de
   arquitectura en la navbar` y `landing-page → Enlace a la documentación... en
   la landing` se funden en `public-site → Descubrimiento de la documentación de
   arquitectura`, unificando navbar (≥640 px y panel móvil) y landing (3 anchos).
3. **Bearer MCP**: `user-auth → Autenticación de clientes MCP mediante Bearer
   token` duplicaba el requisito de endpoint de `mcp-tasks`; sus dos escenarios
   quedan cubiertos por los de `mcp → Endpoint MCP Streamable HTTP con
   autenticación Bearer`.
4. **Aislamiento de tareas**: se mueve de `user-auth` a `todo-tasks`, porque
   describe una propiedad de la tarea y no de la identidad; se añade el escenario
   "Acceso a tarea ajena rechazado" para cubrir lectura/edición/borrado.
5. **Retirada — "Pulido validado con Playwright y guidelines"**: describía un
   proceso de verificación, no un comportamiento observable. Su contenido sigue
   vigente como política en `AGENTS.md` §4 (protocolo de testing proporcional).
   No se pierde cobertura: los requisitos de UI conservan sus criterios
   verificables (foco, contraste, jerarquía, 44 px).

### D4. Índice generado, fuente única

`scripts/sync-especificaciones.mjs` lee `openspec/specs/*/spec.md` en orden
alfabético y escribe `docs/especificaciones.md` con: título, aviso de "archivo
generado", índice con nº de requisitos y escenarios por capacidad, y el contenido
de cada spec bajo `## N. <capability>`. Los encabezados `### Requirement:` se
conservan literales para que el índice sirva de mapa 1:1 con la fuente.

Se sigue el patrón de `scripts/sync-arquitectura.mjs`: ESM sin dependencias,
escritura idempotente (compara antes de escribir) y `--skip-if-missing` para no
bloquear arranque/build si faltara `openspec/specs/`. Se añade a `predev` y
`prebuild` junto al de arquitectura y como script `specs:doc`.

**Alternativa descartada:** publicar el índice como HTML en `/especificaciones`
(patrón de `/arquitectura`). Se descarta en este change porque abre una ruta
pública nueva y su test E2E asociado; el markdown versionado ya resuelve la
legibilidad sin ampliar superficie pública.

### D5. Inventario cerrado en la gobernanza

`openspec/config.yaml` gana `rules.specs` (reglas por artefacto que OpenSpec
inyecta al generar specs) con: (a) el inventario cerrado de las 6 capacidades,
(b) modificar una existente en lugar de crear una nueva salvo justificación
explícita, (c) una conducta por requisito y descripción ≤500 caracteres. `AGENTS.md`
§2 y §1 recogen el inventario y que `docs/especificaciones.md` es generado.

## Risks / Trade-offs

- **Referencias a nombres viejos en la documentación** (`requirement.md`,
  `AGENTS.md`, `docs/arquitectura*.md/html`) → se actualizan los textos vivos;
  el HTML de arquitectura se regenera solo si se toca su fuente (fuera de
  alcance), así que puede mencionar nombres antiguos. Mitigación: los nombres de
  capacidad casi no se citan en esos documentos; se revisa con `grep`.
- **Changes archivados apuntan a rutas retiradas** → irrelevante: el archivo es
  historia ya mergeada y `openspec archive` no se re-ejecuta sobre ellos.
  `openspec doctor` no reporta referencias (no hay `references` declaradas).
- **`retire_capabilities`** no se declara: solo aplica a cambios con entradas
  `REMOVED` en deltas que vacían una capacidad; aquí no hay deltas
  (`skip_specs: true`) y las carpetas se retiran directamente del árbol.
- **Pérdida de texto al mover** → mitigación: mover bloques completos con sus
  escenarios, y verificar con `openspec validate --specs --strict` (9 → 6
  capacidades) y con `git diff --stat` que el conteo total de requisitos baja
  solo por las consolidaciones previstas.
- **`skip_specs` y validación estricta** → con `skip_specs: true` un change sin
  deltas es válido; se comprueba con `openspec validate
  consolidar-especificaciones --strict`.

## Migration Plan

1. Crear las 6 capacidades con el contenido reasignado (mover bloques verbatim).
2. Eliminar las 8 carpetas retiradas y `specs/.gitkeep`.
3. Validar: `openspec validate --specs --strict` y `openspec list --specs`.
4. Añadir el generador, engancharlo a `predev`/`prebuild` y ejecutarlo.
5. Actualizar gobernanza (`config.yaml`, `AGENTS.md`, `requirement.md`).
6. Rollback: `git revert` del commit devuelve el árbol anterior por completo; no
   hay migración de datos ni de esquema.

## Open Questions

Ninguna que cambie los specs, el enfoque o las tareas.
