# Tasks

## 1. Card de tarea con acciones

- [x] 1.1 Reestructurar `TaskItem` a card elevada (`bg-elevated`, borde sutil, radio) con el bloque de acciones dentro y hover que profundiza la elevación, conservando `data-testid`, y verificar `npx tsc --noEmit` pasa y la card se distingue del fondo en reposo.
- [x] 1.2 Añadir `break-words` a título/descripción y formatear la fecha con `Intl.DateTimeFormat`, y verificar con test Vitest (texto largo no desborda, fecha en español) que `npm test` sigue en verde.

## 2. Integración y regresión

- [x] 2.1 Ejecutar `npm test` completo y `npx playwright test` con `data-testid` intactos, más captura en navegador a 1440×900 y 390px, y verificar ambos en verde sin diálogos nativos.
