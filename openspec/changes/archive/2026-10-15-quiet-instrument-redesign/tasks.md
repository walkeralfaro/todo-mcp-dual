# Tasks

## 1. Tokens y fuente base

- [x] 1.1 Añadir tokens `@theme` (ground, surface, ink, muted, accent) en `app/globals.css` y verificar que `npx tsc --noEmit` pasa y las utilidades (`bg-ground`, `text-ink`…) compilan en `npm run dev`
- [x] 1.2 Cargar Stack Sans Headline 300 + Stack Sans Text 400/500 vía `next/font/google` en `app/layout.tsx` con fallback `system-ui` y verificar que el build no depende de red y la fuente se aplica en `body`

## 2. Cabecera del día y controles superiores

- [x] 2.1 Reescribir la cabecera de `app/page.tsx` con titular del día y cifra de no completadas (respetando `estado`/`q`; "Todo al día" si cero) y verificar que la cifra coincide con las filas visibles con y sin filtro
- [x] 2.2 Reestilizar `TaskForm` al lenguaje quiet (superficie en tono, botón primario verde, error legible) sin tocar lógica ni `data-testid` y verificar creando una tarea válida y una inválida (mensaje en español)
- [x] 2.3 Reestilizar `TaskFilters` como botones de texto sobrio con activo en tinta plena y verificar que filtrar por cada estado y buscar actualizan la URL y el listado como antes

## 3. Filas de tareas y pie

- [x] 3.1 Convertir `TaskItem` a fila de dos extremos sin cajas (44px táctil en móvil, foco visible, controles visibles sin hover) conservando `data-testid` y verificar editando, cambiando estado y eliminando una tarea con confirmación
- [x] 3.2 Aplicar pie de una línea sobria y ritmo vertical (secciones separadas por espacio, columna 440–560px) y verificar visualmente en 1440/768/390 sin overflow horizontal

## 4. Verificación e integración

- [x] 4.1 Ejecutar `npm test` (`vitest run`) y `npm run build` y verificar que ambos terminan en verde
- [x] 4.2 Ejecutar `npx playwright test` sin modificar `e2e/` y verificar que el flujo completo pasa, más revisión visual de paridad de flujos y contraste AA del cuerpo y del verde
