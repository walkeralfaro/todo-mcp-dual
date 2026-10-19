# Design: Pie de página global con crédito

## Context

`app/layout.tsx` ya envuelve todo en `<div className="flex min-h-dvh flex-col">`
con `<SiteHeader />` y `<main className="flex w-full flex-1 flex-col lg:min-h-0">`.
Esa columna es exactamente el patrón sticky footer: `min-h-dvh` asegura altura
mínima de viewport y `main` con `flex-1` absorbe el sobrante, empujando al fondo
lo que venga después. Solo falta el pie.

Hoy hay pies locales en `app/(protegido)/mcp/page.tsx` y
`app/(protegido)/tareas/page.tsx` (dentro de la rejilla), y `LandingFooter` en
`components/landing/landing-close.tsx` termina con `© 2026 Todo App`. El enlace
`footer-arquitectura` de `LandingFooter` se usa en pruebas a 390 px, así que
debe conservarse.

## Goals / Non-Goals

**Goals:**

- Un único pie con el crédito, visible en `/`, `/tareas` y `/mcp`.
- Anclaje al fondo del viewport con contenido corto y al final del documento con scroll.
- Cambio mínimo, coherente con los tokens de diseño existentes.

**Non-Goals:**

- Cambiar la navegación, el header o el contenido de las páginas.
- Afectar `/arquitectura` (HTML estático servido aparte, fuera del layout).
- Usar `position: fixed` o `sticky` (el requisito describe flujo normal).

## Decisions

### 1. Componente `SiteFooter` server + inserción en el layout raíz

Nuevo `components/site-footer.tsx` (sin `"use client"`, es texto estático) y
`<SiteFooter />` justo después de `</main>` en `app/layout.tsx`. Se descarta
hacerlo por página: el layout raíz ya ofrece la columna y evita repetir el pie
en cada ruta. Se descarta `position: fixed` porque taparía contenido y no
cumpliría "abajo de todo" con scroll.

### 2. Estilos alineados con el design system

`border-t border-ink/10 px-5 py-4 text-center text-[13px] text-muted`, mismo
tono que los pies retirados. `lang="en"` en el párrafo (el resto del documento
es `lang="es"`) y el corazón `❤️` con `aria-hidden="true"` más un texto
`sr-only` para que el lector de pantalla no anuncie "red heart".

### 3. Consolidación de pies existentes

- `/mcp`: se elimina su `<footer>`.
- `/tareas`: se elimina su `<footer>` de la fila 4 de la rejilla; queda
  `lg:row-start-4` sin uso (inofensivo, o se puede limpiar el `grid-rows` si
  procede sin alterar el layout).
- `LandingFooter`: se mantiene el mapa del sitio y el enlace
  `footer-arquitectura`; se quita solo la línea `© 2026 Todo App`.

### 4. Verificación proporcional

Al ser presentacional (sin lógica), no se añaden tests ni se ejecuta la suite:
solo `npm run lint`, `npm run typecheck` y una revisión visual de `/`,
`/tareas` y `/mcp` con contenido corto y largo (390 y 1024 px, sin scroll
horizontal). Se ajusta `AGENTS.md` §4 para que esta proporcionalidad sea la
norma.

## Risks / Trade-offs

- [En `/tareas` desktop la rejilla usa `lg:overflow-hidden` y pierde ~45 px de
  alto al aparecer el pie] → La lista tiene scroll interno (`lg:overflow-y-auto`)
  y el layout ya reparte con `flex-1 min-h-0`; se revisa visualmente que no
  aparezca doble scrollbar.
- [Retirar el pie de `/tareas` toca el requisito `todo-tasks` "Footer al borde
  inferior sin sticky"] → El comportamiento pedido se mantiene con el pie
  global; el requisito no fija el texto, así que no requiere delta.
- [Dos pies visibles si algo queda sin limpiar] → La consolidación es parte de
  las tareas y se comprueba que cada página muestre un único pie.

## Migration Plan

- Cambio de UI sin datos: no requiere migración ni rollback especial (revertir
  el commit).

## Open Questions

Ninguna. Texto confirmado por el usuario: "developed with ❤️ by walker alfaro".
