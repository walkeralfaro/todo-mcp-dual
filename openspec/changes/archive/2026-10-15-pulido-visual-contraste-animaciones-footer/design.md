# Design

## Context

Estado actual (verificado): `tw-animate-css` no está instalado, así que las clases `animate-in/out`, `fade-*` y `zoom-*` que emiten `alert-dialog.tsx`/`select.tsx` no producen ningún keyframe — el diálogo aparece de golpe. `TaskForm` usa `bg-surface (#e1dad7)` sobre fondo `bg-ground (#ebe5e3)`: contraste 1.11:1, indistinguibles. El footer vive dentro de la sección con scroll, pegado a la lista. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Activar transiciones reales en `AlertDialog`/`Select` con duraciones y easings con criterio, y micro-transiciones hover/active.
- Elevar superficies (card, menús) con contraste AA garantizado para el texto secundario.
- Llevar el footer al borde inferior solo con layout.

**Non-Goals:**
- No cambiar la paleta (mismos huesos rosado/tinta/verde), ni flujos, ni `data-testid`, ni contrato MCP.
- No introducir librerías de animación JS (Framer Motion) ni virtualización de lista.

## Decisions

### D1 — Activar el motor de animación con `tw-animate-css`
Instalar `tw-animate-css` y añadir `@import "tw-animate-css";` en `globals.css` (patrón estándar Tailwind v4 de shadcn). Es lo que da vida a las clases `animate-in/out` ya presentes.
- Alternativas: (a) keyframes manuales propios — descartado, duplica el sistema que shadcn ya emite y diverge del upstream; (b) Framer Motion — descartado, sobrecarga JS para transiciones predeterminadas que CSS ejecuta fuera del hilo principal (criterio `emil-design-eng`: CSS bajo carga).

### D2 — Motion según `emil-design-eng`: rápido, `ease-out`, origen correcto
- Diálogo (modal, ocasional): entrada ~250ms `ease-out` fuerte (`cubic-bezier(0.23,1,0.32,1)`), `scale(0.95)` + opacidad — nunca desde `scale(0)`; salida más rápida (~150ms). Origen centro (excepción modal: no usa el origen del trigger).
- `Select` (frecuente): 150–200ms, mismas propiedades (`transform`/`opacity` únicamente, nunca `transition: all`).
- Botones/filas: `scale(0.97)` en `:active` (100–160ms) y cambios de color con `transition` de propiedades explícitas; hover tras `@media (hover:hover)`.
- `prefers-reduced-motion`: variante que conserva fundido breve de opacidad y elimina escala/desplazamiento; el foco y el contenido no cambian.
- Alternativa descartada: animar apertura con keyframes de entrada/salida simétricos largos (>300ms) — haría la UI lenta según el framework de decisión (diálogo = ocasional, standard; nada justifica >300ms).

### D3 — Superficie elevada clara + borde + sombra para card y menús
Nueva superficie elevada cálida casi blanca (p. ej. `#f7f4f2`, mismo matiz que `ground`) con `border-ink/10` y sombra sutil para la card del formulario y los contenidos de `Select`/`AlertDialog`; los inputs conservan `bg-ground` para seguir distinguiéndose dentro de la card. Sobre `#f7f4f2` el `muted` actual sube a ~5.2:1 (AA). Si la medición en implementación queda bajo 4.5:1, se oscurece `muted` solo lo necesario en lugar de cambiar la paleta.
- Alternativas: (a) oscurecer `surface` manteniendo el tono — descartado, achica la distancia con `ink` y embarra la estética sobria; (b) solo borde sin aclarar — descartado, no resuelve menús flotantes sobre fondo idéntico.
- Guía aplicada (`web-design-guidelines`): estados interactivos más prominentes en hover/active/focus que en reposo; foco visible existente intacto.

### D4 — Footer al borde inferior con grid, sin sticky/fixed
Sacar el footer de la sección con scroll y darle fila propia al final del grid desktop (`row-4`, `col 1/-1`, ancho de página), con la columna de lista en `minmax(0,1fr)` absorbiendo el espacio libre: con pocas tareas el footer baja al borde del viewport; con muchas, queda tras el scroll de la región de lista, siempre en flujo normal. En móvil queda al final del documento. Prohibido `sticky`/`fixed` por requisito explícito.
- Alternativa descartada: `sticky bottom-0` — viola el requisito y puede tapar el foco/controles (además la guía exige que overlays fijos no cubran el elemento enfocado).

### D5 — Skills: `emil-design-eng` + `web-design-guidelines`, sin `taste-skill`
`emil-design-eng` fundamenta D2 (duraciones, easings, origen, `scale(0.95)`, `:active`). `web-design-guidelines` (vía fetch en planificación) fundamenta contraste AA, foco, `prefers-reduced-motion`, `transform`/`opacity` y anti-patrones (`transition: all`, `outline-none`). `taste-skill` se descarta: art direction para landing/marketing, sobredimensionado para pulido de app existente.

## Risks / Trade-offs

- [Animaciones vs E2E] Radix monta el contenido en portal con estados intermedios; aserciones inmediatas tras abrir pueden ser flaky → Mitigación: esperar por `role="alertdialog"` / `role="option"` como ya hace la suite, y desactivar animaciones en E2E si algún paso parpadea (`--bankai` no; basta `expect` con timeout).
- [Token nuevo y AA colateral] aclarar superficies cambia ratios en todos los textos que pisen la card → Mitigación: medir `muted` sobre cada superficie en implementación y ajustar `muted` si baja de 4.5:1.
- [Footer fuera de la región de scroll] en desktop alto con pocas tareas el aside (formulario) puede quedar más corto que la columna → Mitigación: el aside conserva su propio scroll si desborda; el footer a ancho completo ancla ambas columnas visualmente.

## Migration Plan

1. Instalar `tw-animate-css`, importar en `globals.css`, añadir tokens/easings y bloque `prefers-reduced-motion`.
2. Retocar `select.tsx`/`alert-dialog.tsx` (orígenes y duraciones) y `task-form.tsx`/`task-item.tsx` (superficie, hover/active).
3. Mover el footer en `page.tsx` a fila propia; verificar `tsc`, `npm test` y `npx playwright test` (incluida pasada con `reduced-motion`).
4. Rollback: revertir commits en orden inverso; sin cambios de esquema ni API.

## Open Questions

- Ninguna.
