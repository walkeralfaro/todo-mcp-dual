# Tasks

## 1. Tokens noche y fuente

- [x] 1.1 Sustituir los tokens de color por el tema noche/neón con `color-scheme: dark` y `theme-color`, medir cada par texto/superficie hasta AA (≥4.5:1, ≥3:1 en neón grande) ajustando `muted`/`destructive` si hace falta, y verificar `npx tsc --noEmit` pasa y la página carga en oscuro sin texto ilegible.
- [x] 1.2 Sustituir Stack Sans por Albert Sans (enlaces con `display: swap`, preload crítico, tokens y escala de la dirección) y verificar que no hay FOUT regresivo ni tamaños fuera de escala y `npm test` sigue en verde.

## 2. Componentes y cifra viva

- [x] 2.1 Migrar superficies de formulario, filas, filtros y primitivas `ui/*` al tema oscuro (escalones de tono, foco neón con AA, COMPLETADA en neón) conservando `data-testid` y filas sin cajas, y verificar visualmente a 1440×900 y 390px.
- [x] 2.2 Convertir la cifra del titular en héroe (5–7vw, neón, `tabular-nums`) con pulso breve al descontar y sin movimiento con `prefers-reduced-motion`, y verificar con Playwright que al completar una tarea la cifra descuenta con pulso y queda en su valor final.

## 3. Integración y regresión

- [x] 3.1 Ejecutar `npm test` completo y `npx playwright test` con `data-testid` intactos, más pasada con `reduced-motion` y medición de contraste sin fallos, y verificar ambos en verde sin diálogos nativos.
