# Proposal: Pie de página global con crédito

## Why

Hoy no existe un pie de página común: `/mcp` y `/tareas` renderizan un pie
local con el texto "Todo App · UI y MCP sobre la misma base." (el de `/tareas`
vive dentro de la rejilla), y la landing cierra con `© 2026 Todo App`. Falta el
crédito del autor y el conjunto es inconsistente. Un único pie en el layout
raíz da un cierre común y garantiza el comportamiento de "siempre abajo" sin
duplicar marcado.

## What Changes

- Nuevo componente `components/site-footer.tsx` con el crédito
  "developed with ❤️ by walker alfaro".
- Se monta en `app/layout.tsx` después de `<main>`, dentro de la columna
  `flex min-h-dvh flex-col` ya existente, de modo que quede al borde inferior
  del viewport cuando el contenido es corto y al final del documento cuando
  hay scroll. Sin `position: fixed` ni `sticky`.
- Consolidación: se retiran los pies locales de `/mcp` y `/tareas`, y la línea
  `© 2026 Todo App` de `LandingFooter` (se conserva su mapa del sitio y el
  enlace `footer-arquitectura`).
- Ajuste de gobernanza: `AGENTS.md` §4 pasa de exigir la suite completa por
  cada cambio a una política de testing proporcional (sin tests para cambios
  puramente presentacionales).

## Capabilities

### New Capabilities

- `site-footer`: comportamiento del pie de página global (crédito visible en
  todas las páginas del layout raíz y anclaje al fondo sin tapar contenido).

### Modified Capabilities

- Ninguna: el requisito existente "Footer al borde inferior sin sticky" de
  `todo-tasks` sigue cumpliéndose (el pie global mantiene flujo normal y
  anclaje al fondo); solo cambia el texto renderizado, que no está especificado.

## Impact

- **Código**: `app/layout.tsx`, nuevo `components/site-footer.tsx`,
  `app/(protegido)/tareas/page.tsx`, `app/(protegido)/mcp/page.tsx`,
  `components/landing/landing-close.tsx`.
- **Gobernanza/documentación**: `AGENTS.md` §4 y una línea en
  `requirement.md` sobre el pie global.
- **Tests**: ninguno nuevo. Es un cambio presentacional sin lógica; la
  verificación se limita a `npm run lint` y `npm run typecheck` (no `npm test`
  ni `npm run test:e2e`).
- **Sin** cambios en base de datos, API, Server Actions ni tools MCP.
