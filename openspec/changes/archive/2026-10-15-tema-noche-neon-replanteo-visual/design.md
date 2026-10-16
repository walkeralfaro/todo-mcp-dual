# Design

## Context

Estado actual (verificado): tokens claros (`ground #ebe5e3`, `ink #2b2622`, `accent #0f7d45`), Stack Sans vía Google Fonts en `layout.tsx`, y superficies que separan con borde + sombra. La exploración con `taste-skill` (dirección `product-performs`, seed 1663610936, redraws de paleta con motivo "brief pide noche neón") decidió: tema oscuro integral, Albert Sans, filas desnudas y galaxia solo sugerida. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Sustituir el sistema de color claro por el tema noche/neón con AA en cada par texto/superficie.
- Sustituir Stack Sans por Albert Sans en página y producto con la escala de la dirección.
- Convertir la cifra del titular en héroe vivo con pulso al descontar.

**Non-Goals:**
- No cambiar layout, flujos, `data-testid`, API ni MCP; no añadir fotos, starfields, degradados ni sombras en reposo nuevas.
- No conmutador claro/oscuro en este cambio (tema oscuro único y decidido).

## Decisions

### D1 — Tokens noche con `color-scheme: dark`
`ground #0a0e1a`, `surface #131a2e`, `elevated` más claro por escalón (p. ej. `#1a2340`, a validar por medición), `ink #eef1ff`, `muted #9aa3c0`, `accent` neón `#2dffa8`, `destructive` adaptado al oscuro (p. ej. `#ff7a7a`, a validar AA). `color-scheme: dark` en `<html>` (scrollbars e inputs nativos) y `<meta name="theme-color" content="#0a0e1a">`. Las sombras en reposo se sustituyen por escalones de tono (regla taste-skill); sombra solo en lo que flota (menús, diálogo).
- Alternativa descartada: mantener superficies claras sobre fondo oscuro — rompería la unidad nocturna y el contraste medido.

### D2 — Albert Sans como única familia
Sustituir los enlaces de Stack Sans por Albert Sans 400/500/600 con `display: swap` y `preload` de la fuente crítica; `font-display` pasa a Albert Sans 600 con tracking -0.035em y `font-text` a 400/500. Escala de la dirección (pasos 13/17/20/26/64px fluidos) mapeada a los usos actuales sin añadir un sexto tamaño.
- Alternativa descartada: retener Stack Sans — contradice la decisión explícita de la exploración.

### D3 — Cifra héroe con pulso neón
Titular a 5–7vw, cifra en neón con `tabular-nums`; al cambiar el valor, pulso breve de `opacity`/`transform` (≤300ms, `ease-out`) disparado por el cambio de cifra; con `prefers-reduced-motion` el valor cambia sin pulso. El foco y el contenido no dependen de la animación.
- Alternativa descartada: animar todo el titular — el texto debe permanecer estable y legible; solo la cifra celebra.

### D4 — Controles elevados por tono, filas intactas
`Select`/`AlertDialog`/card/form pasan a superficies oscuras con `border-white/10`; foco y anillo con acento neón verificando AA sobre oscuro; filas de tareas sin cajas (decisión de exploración) con hover por tono. El estado COMPLETADA usa punto neón en lugar del verde actual.
- Guía aplicada (`web-design-guidelines`): estados interactivos más prominentes en hover/focus; foco nunca cubierto; `autocomplete`/`type` de inputs intactos.

## Risks / Trade-offs

- [`destructive` actual sobre oscuro] `#b91c1c` con texto blanco puede perder AA sobre superficies oscuras → Mitigación: medir y aclarar el rojo (p. ej. `#ff7a7a`) solo para texto/botón sobre oscuro.
- [Neón y legibilidad] el menta en cuerpos pequeños puede vibrar → Mitigación: neón solo en cifra héroe, acción primaria y marca COMPLETADA; resto en `ink`/`muted`.
- [E2E con pulso] la cifra cambia de valor durante el flujo existente → Mitigación: las aserciones esperan texto final con timeout, como hoy.

## Migration Plan

1. Tokens + `color-scheme` + `theme-color` en `globals.css`/`layout.tsx`; medir todos los pares AA.
2. Fuente Albert Sans (enlaces, tokens, preload) y escala aplicada al titular y jerarquía.
3. Componentes a superficies oscuras (form, item, filters, `ui/*`) + pulso de cifra con `reduced-motion`.
4. Verificar `tsc`, `npm test`, `npx playwright test` + pasada `reduced-motion` y 390px.
5. Rollback: revertir; sin cambios de esquema ni API.

## Open Questions

- Ninguna.
