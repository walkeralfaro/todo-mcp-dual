# Tasks

## 1. Composición y contenido de la landing

- [x] 1.1 Antes de editar componentes, consultar la guía pertinente de Next.js 16 instalada en `node_modules/next/dist/docs/`; verificar que las APIs de página y navegación usadas por el rediseño siguen sus indicaciones vigentes.
- [x] 1.2 Reordenar `app/page.tsx` y sus secciones en una secuencia breve: promesa del producto, demo, pasos MCP con configuración copiable, herramientas y CTA final; conservar IDs de navegación útiles y verificar orden, titular y CTA con Playwright.
- [x] 1.3 Retirar la composición repetitiva de mosaico y fragmentos decorativos, y sustituir los textos ambiguos y tiempos de configuración por pasos numerados con afirmaciones verificables; comprobar que no quedan duraciones prometidas ni textos de sección huérfanos.

## 2. Demo y prueba MCP

- [x] 2.1 Reducir las filas iniciales de la demo a una muestra compacta manteniendo añadir, completar/reabrir, estado local y aviso sin JavaScript; actualizar `e2e/landing.spec.ts` y verificar interacción sin escrituras al API y fallback estático.
- [x] 2.2 Corregir la escala tipográfica de los fragmentos y del bloque de configuración para que sus tamaños explícitos se respeten y el contenido sea legible en móvil; actualizar/verificar la prueba Playwright de copiar el endpoint y la cabecera Bearer.
- [x] 2.3 Integrar la configuración copiable junto al paso de configuración MCP y comprobar con Playwright que el botón sigue disponible, copia el JSON del despliegue y muestra confirmación.

## 3. Header y accesibilidad

- [x] 3.1 Ajustar botones y enlaces visibles del header compartido a un área interactiva mínima de 44 × 44 píxeles CSS, preservando etiquetas, estados de sesión y destinos; verificar dimensiones y foco con Playwright en anónimo y autenticado.
- [x] 3.2 Verificar navegación por teclado, foco visible, contraste y ausencia de colisiones entre marca y acciones en anchos móvil y escritorio; actualizar las pruebas E2E afectadas.

## 4. Integración visual

- [x] 4.1 Añadir comprobaciones Playwright para 390, 768 y 1440 px que verifiquen ausencia de scroll horizontal y recortes de contenido, titulares principales de dos líneas como máximo y disposición legible; guardar/revisar capturas de los tres anchos.
- [ ] 4.2 Ejecutar `npm test` y la suite E2E de Playwright de landing y autenticación; resolver fallos y verificar los flujos de acceso, demo local, configuración MCP y navegación del header.
