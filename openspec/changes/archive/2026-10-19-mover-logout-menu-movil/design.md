# Design: Mover "Cerrar sesión" al menú móvil

## Context

Ver `proposal.md` — Why. El estado actual de `components/site-header.tsx`:

- El contenedor de controles es un `flex items-center gap-2` con, en orden de
  DOM: nav de escritorio (`hidden sm:flex`), wrapper de la hamburguesa
  (`sm:hidden`, con `navToggleWrapperRef`), bloque de sesión (`user ? …`) y
  enlace de documentación (`hidden sm:inline-flex`).
- El bloque de sesión contiene avatar + nombre (`hidden md:inline`) + botón
  `auth-signout-btn`, que hoy es visible en todos los anchos.
- El panel `#mobile-nav` (`absolute inset-x-0 top-full … sm:hidden`) contiene
  solo los enlaces "Mis tareas", "Tokens MCP" y "Cómo está hecha".
- El layout de la barra es `h-14` fijo, así que cualquier control nuevo en la
  barra móvil debe caber en una sola línea.

Restricciones relevantes:

- El panel y la barra viven en el mismo `<header>` (`headerRef`), lo que
  mantiene el cierre por clic fuera y la devolución de foco con Escape.
- `e2e/todo-auth.spec.ts:54-58` cierra sesión a 390 px; `e2e/nav-movil.spec.ts`
  prueba el panel móvil; `e2e/arquitectura.spec.ts:207-213` comprueba a
  640–1023 px que `auth-signout-btn` no parte la etiqueta.
- Los specs usan locators estrictos por `data-testid`.

## Goals / Non-Goals

**Goals:**

- En móvil, barra con avatar y, a su derecha, la hamburguesa.
- "Cerrar sesión" en el panel móvil, a ancho completo y con área táctil.
- Mantener intacto el comportamiento de escritorio y del estado anónimo.
- No romper locators ni romper el orden de tabulación existente.

**Non-Goals:**

- No se mueve el avatar dentro del panel (sigue en la barra).
- No se añade nombre/email al panel.
- No se aborda el caso de redimensionar de móvil a escritorio con el panel
  abierto: `navOpen` sigue siendo `true` y el panel vuelve a aparecer si se
  regresa a móvil. Es comportamiento preexistente.
- No se toca autenticación, rutas ni el estado de sesión.

## Decisions

### 1. Reordenar el DOM, no invertir con CSS

Mover el wrapper de la hamburguesa (con su `ref`) para que quede **después**
del bloque de sesión. Se descarta `flex-row-reverse` u `order-*` porque
alteraría el orden visual sin cambiar el de tabulación y complicaría el
mantenimiento; mover el nodo deja DOM, orden de foco y lectura en pantalla
alineados.

En móvil, el nombre está oculto (`md:inline`) y el enlace de documentación
también (`hidden sm:inline-flex`), así que el resultado es:

```text
Todo App                    (avatar) (☰)
```

En `≥sm` la hamburguesa sigue oculta y el orden novisible no cambia.

### 2. Dos botones responsivos con `data-testid` distinto

CSS no puede mover un nodo entre la barra y el panel (son contenedores
distintos) y mantener un único elemento obligaría a decidir con JavaScript
(`matchMedia`), con riesgo de parpadeo en la hidratación. Se renderizan dos
instancias:

- Barra, envuelta en un contenedor `hidden … sm:flex` para que no ocupe ni
  sea enfocable por debajo de `sm`: conserva `data-testid="auth-signout-btn"`.
- Panel, dentro de `#mobile-nav` (ya `sm:hidden`):
  `data-testid="auth-signout-btn-movil"`, siguiendo el patrón
  `nav-arquitectura-movil`.

Se evita duplicar `auth-signout-btn` porque Playwright en modo estricto
resolvería dos elementos y los E2E de escritorio fallarían.

### 3. Componente local `SignOutButton`

Ambas instancias comparten `signingOut`, `signOutError` y `handleSignOut`, que
siguen viviendo en `SiteHeader`. Se extrae un `SignOutButton` a nivel de módulo
(no una función que devuelve JSX ni un componente definido dentro del render,
para no remontarlo en cada render) con props `testId`, `className`, `disabled`,
`busy` y `onClick`. Así se evita duplicar texto, estado pendiente y estilos.

### 4. Mensaje de error junto a la acción que lo provocó

`signOutError` se renderiza en la barra solo desde `sm` (el span pasa a
`hidden sm:inline`) y en el panel en móvil. Un nodo con `display:none` queda
fuera del árbol de accesibilidad, así que el `role="alert"` se anuncia una sola
vez. Si el logout del panel falla, el panel permanece abierto (hoy
`setNavOpen(false)` solo ocurre tras éxito), por lo que el error es visible sin
cambios adicionales.

### 5. Estilos del logout en el panel

Separador `mt-2 border-t border-ink/10 pt-2`, botón `variant="ghost"` a ancho
completo (`w-full justify-start`), `h-11`, `text-destructive` con hover
`bg-destructive/10`, y texto "Cerrar sesión" / "Cerrando sesión…" según
`signingOut`. Se alinea a la izquierda para seguir el ritmo de los enlaces del
panel. No se añade icono: mantiene la paridad con el botón de escritorio.

### 6. Testids y specs E2E

- `auth-signout-btn` se mantiene para escritorio (`≥640 px`), lo que conserva
  `todo.spec.ts`, `proteccion.spec.ts`, `mcp-tokens.spec.ts` y
  `arquitectura.spec.ts` sin cambios.
- `e2e/todo-auth.spec.ts` abre el menú antes de pulsar el logout móvil.
- `e2e/nav-movil.spec.ts` añade: orden avatar → hamburguesa, logout oculto con
  el panel cerrado, logout visible con área táctil en el panel, y cierre de
  sesión real desde el panel al final del flujo ya existente.

## Risks / Trade-offs

- [Dos botones con estados compartidos pueden desincronizarse visualmente] →
  Un único `signingOut`/`signOutError` en `SiteHeader` y un único componente
  `SignOutButton` con las mismas props de estado.
- [Un testid nuevo añade deuda de nomenclatura] → Se sigue el patrón ya
  existente `*-movil` y se documenta en `docs/arquitectura.md` §9.2.
- [El error de logout en la barra a 640–1023 px podría partir la línea] → Es
  comportamiento preexistente; el cambio no lo empeora y el rango ya está
  cubierto por `arquitectura.spec.ts`.
- [E2E más lentos por la latencia de Turso] → El test de móvil reutiliza el
  usuario ya registrado y cierra sesión al final del mismo flujo, sin alta
  adicional.
- [La barra `h-14` no admite más controles en móvil] → Al salir el logout de la
  barra, la fila queda con marca + avatar + hamburguesa, con más holgura que
  antes.

## Migration Plan

- Cambio puramente de UI, sin datos ni contratos: no requiere migración.
- Despliegue: un único commit de `components/site-header.tsx` más tests y
  documentación.
- Rollback: revertir el commit; no hay estado persistido que deshacer.

## Open Questions

Ninguna: las decisiones de alcance (hamburguesa a la derecha, testid propio del
logout móvil y escritorio sin cambios) están confirmadas por el usuario.
