# Tasks

## 1. Motor de animación y tokens

- [x] 1.1 Instalar `tw-animate-css` e importarlo en `app/globals.css` junto a los easings de diseño y el bloque `prefers-reduced-motion`, y verificar `npx tsc --noEmit` pasa y el diálogo ya anima al abrirse en `npm run dev`.
- [x] 1.2 Añadir el token de superficie elevada y aplicarlo a la card del formulario y a los contenidos de `Select`/`AlertDialog` (con borde sutil y sombra), y verificar visualmente que card y menú se distinguen del fondo y `npm test` sigue en verde.

## 2. Contraste AA y micro-transiciones

- [x] 2.1 Medir el contraste de `muted` sobre cada superficie (fondo, card, menú) y ajustar tono de texto o superficie hasta ≥4.5:1, y verificar con script de medición o herramienta (p. ej. lighthouse/axe) que no hay fallos de contraste en la página principal.
- [x] 2.2 Aplicar transiciones de `transform`/`opacity` con duraciones y easings de diseño al diálogo, desplegable, botones y filas (incluida variante `prefers-reduced-motion`), y verificar con test Playwright que el diálogo entra con transición y con `reduced-motion` emulado no hay movimiento y el foco sigue gestionado.

## 3. Footer al borde inferior

- [x] 3.1 Mover el footer fuera de la región con scroll a fila propia al final del grid desktop (ancho completo, sin `sticky`/`fixed`) y al final del documento en móvil, y verificar a 1440×900 con lista vacía que el footer toca el borde inferior sin tapar contenido ni foco, y `npx playwright test` pasa.

## 4. Integración y regresión

- [x] 4.1 Ejecutar `npm test` completo y `npx playwright test` con `data-testid` intactos y sin diálogos nativos (`grep -rn "window.confirm\|window.alert" components/ app/` vacío), y verificar ambos en verde.
