# Proposal

## Why

La UI actual, aunque correcta en flujos y accesibilidad, se percibe apagada: todo comparte tonos beige/rosados sin nada decidido que mire el ojo, y el usuario pide un replanteo con carácter. La exploración con `taste-skill` (dirección `product-performs`, seed 1663610936) fundamenta el giro: tema oscuro "turno de noche" con un único neón menta reservado a la cifra viva y al acto de completar.

## What Changes

- Tema oscuro integral: fondo noche `#0a0e1a`, superficie `#131a2e`, tinta `#eef1ff`, secundario `#9aa3c0` y acento neón menta `#2dffa8` (contrastes medidos: 17.1 / 6.9 / 14.6 :1, todos AA). Sin degradados, sin polvo de estrellas, sin fotos: la noche es concepto, no decoración (decisión de exploración: galaxia sugerida).
- Tipografía Albert Sans (400/500/600) en página y producto, en lugar de Stack Sans; titular "Hoy quedan N" crecido a 5–7vw como héroe que descuenta en vivo.
- El neón va a una sola cosa: la cifra del día y el momento de completar (pulso al tachar). Todo lo demás, quieto y oscuro.
- Filas de tareas desnudas (se mantiene la regla del spec), controles elevados por escalones de tono, sombras solo en lo que flota (menús, diálogo).
- Sin cambios de flujos, validaciones, API, modelo de datos ni contrato MCP; se conservan todos los `data-testid` y el flujo E2E.

## Capabilities

### New Capabilities

- Ninguna: es replanteo visual de comportamientos ya especificados.

### Modified Capabilities

- `todo-tasks`: cambian requisitos de presentación — sistema de color (tema oscuro + neón), tipografía (Albert Sans), titular héroe con cifra viva y pulso al completar. Flujos y `data-testid` intactos.

## Impact

- Afectado: `app/globals.css` (tokens noche/neón, `color-scheme: dark`, `theme-color`), `app/layout.tsx` (fuente Albert Sans, metadatos de tema), todos los componentes con color (`task-form`, `task-item`, `task-filters`, `ui/*`: superficies, bordes, focos, selección).
- Decisiones de exploración vinculadas: galaxia sugerida (sin starfield), Albert Sans adoptado, filas desnudas.
- No afecta: `lib/`, `app/actions.ts`, Prisma/SQLite, `/api/mcp`, specs `mcp-tasks`.
- Riesgo: regresión de contraste y E2E; se mitiga midiendo cada par texto/superficie y verificando con Vitest + Playwright (incluido `reduced-motion`).
