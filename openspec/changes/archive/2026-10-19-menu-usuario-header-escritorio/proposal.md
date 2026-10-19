# Proposal: Menú de usuario en el header de escritorio

## Why

Con sesión, el header de escritorio acumula seis controles en una sola fila de
56 px: marca, "Mis tareas", "Tokens MCP", avatar, nombre y "Cerrar sesión",
más el enlace "Cómo está hecha". El bloque avatar + nombre + "Cerrar sesión"
ocupa el mismo espacio que la navegación y obliga a recortar etiquetas y a
comprimir áreas táctiles. Agrupar identidad y cuenta en un menú desplegable
libera la barra sin perder ninguna acción.

## What Changes

- **Menú de usuario en el header de escritorio (≥640 px)**: el avatar + nombre
  pasa a ser un botón que despliega un menú con dos ítems, "Tokens MCP" y
  "Cerrar sesión". Ambos dejan de mostrarse sueltos en la barra.
- **La barra queda con cuatro controles**: marca "Todo App", "Mis tareas",
  el disparador del menú de usuario y "Cómo está hecha".
- **Nombre en la barra**: se muestra solo el primer nombre, recortado a un
  máximo de 10 caracteres, para que el disparador no compita por el ancho.
- **"Cómo está hecha" más destacado**: el enlace a la documentación deja el
  estilo apagado y pasa a un chip con el color de acento del sistema en la
  barra de escritorio, sin cambiar su texto, su icono, su área táctil ni su
  apertura en pestaña nueva.
- **Nuevo `components/ui/dropdown-menu.tsx`** construido sobre `radix-ui`
  (ya es dependencia del proyecto; **no** se añaden paquetes).
- **Accesibilidad**: disparador con `aria-haspopup="menu"`, `aria-expanded` y
  `aria-controls`; ítems de al menos 44 × 44 px con foco visible; Escape cierra
  y devuelve el foco al disparador; el clic fuera cierra; el error de cierre de
  sesión se muestra dentro del menú.
- **Móvil sin cambios**: por debajo de 640 px sigue el panel `#mobile-nav`
  actual (Mis tareas, Tokens MCP, Cómo está hecha y Cerrar sesión).
- **Gobernanza de testing**: `AGENTS.md` §4 incorpora la categoría "cambios de
  UI/interacción sin lógica de negocio" (reubicar controles, menús, estados de
  apertura) para dejar explícito que este tipo de modificación **no** exige
  E2E, Playwright, Turso ni bases de datos, y que solo se exige test unitario
  cuando se extrae lógica pura testeable.
- **Lógica pura extraída**: `lib/user-display-name.ts` con el recorte del
  nombre y su test unitario en Vitest (entorno `node`, sin BD).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `user-auth-ui`: el header con sesión cambia lo que se muestra en la barra
  ("Tokens MCP" y "Cerrar sesión" pasan al menú de usuario en escritorio) y se
  añade un requisito para el menú de usuario; el requisito de la barra móvil
  deja de exigir "Cerrar sesión" visible en la barra desde 640 px; y el enlace
  de documentación de la navbar pasa a destacarse visualmente en la barra.

## Impact

- **Código**: `components/site-header.tsx` (refactor del bloque de sesión y
  destacado del enlace "Cómo está hecha"), nuevo
  `components/ui/dropdown-menu.tsx`, nuevo `lib/user-display-name.ts`.
- **Documentación**: `AGENTS.md` §4 (nueva categoría de testing) y
  `requirement.md` (nota del menú de usuario en escritorio).
- **Dependencias**: ninguna nueva (`radix-ui` ya está instalada y expone
  `DropdownMenu`).
- **Tests**:
  - Unitario nuevo: `lib/user-display-name.test.ts` (Vitest, entorno `node`).
  - **No** se ejecutan ni se añaden pruebas E2E, Playwright, Turso ni de base
    de datos para este cambio.
  - **Fuera de alcance**: los specs E2E que asumen `auth-signout-btn` y
    `nav-mcp` visibles en la barra de escritorio quedan desactualizados; su
    ajuste no forma parte de este cambio.
