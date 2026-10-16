# Tasks

## 1. Buscador elevado con foco interior

- [x] 1.1 Elevar el `InputGroup` del buscador (`bg-elevated`, borde sutil, sombra) y cambiar su foco a anillo interior no recortable, y verificar con Playwright a 1440×900 y 390px que el foco por teclado se muestra completo en los cuatro lados y `npx tsc --noEmit` pasa.

## 2. Filtros segmentados

- [x] 2.1 Convertir el `ToggleGroup` en control segmentado (pista contenida, pastilla activa elevada con sombra y texto `ink`) sin cambiar comportamiento ni `data-testid`, y verificar visualmente la jerarquía buscador/filtros/tareas y que `npm test` sigue en verde.

## 3. Integración y regresión

- [x] 3.1 Ejecutar `npm test` completo y `npx playwright test` con `data-testid` intactos, más navegación por teclado del buscador y los filtros, y verificar ambos en verde sin diálogos nativos.
