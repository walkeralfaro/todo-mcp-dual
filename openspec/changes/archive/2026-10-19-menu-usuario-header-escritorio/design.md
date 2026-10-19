# Design: Menú de usuario en el header de escritorio

Ver `proposal.md` para motivación y alcance. Ver
`specs/user-auth-ui/spec.md` para los requisitos.

## Context

`components/site-header.tsx` es un client component que ya resuelve, con estado
propio, dos patrones de despliegue:

- El **panel móvil** `#mobile-nav` (bajo 640 px): `navOpen`, cierre con Escape
  y foco devuelto al botón, cierre al pulsar fuera del header (`headerRef`),
  cierre al navegar y al abrir el modal.
- El **botón de sesión de escritorio**: avatar + nombre + `SignOutButton`
  sueltos en la barra, con `signOutError` mostrado como texto junto a ellos.

El proyecto ya usa el paquete unificado `radix-ui` (`import { Dialog as
DialogPrimitive } from "radix-ui"` en `components/ui/dialog.tsx`) y expone
`DropdownMenu`; no hay dependencias nuevas que añadir. Existe además un patrón
consolidado de helpers puros en `lib/*.ts` con su test en
`lib/*.test.ts` (Vitest, entorno `node`, sin base de datos).

## Goals / Non-Goals

**Goals:**

- Un patrón de menú desplegable reutilizable en `components/ui/`, coherente con
  el resto de primitivas shadcn del proyecto.
- Que la barra de escritorio con sesión baje a cuatro controles visibles.
- Concentrar el recorte del nombre en una función pura y testeable.
- Destacar el enlace "Cómo está hecha" con el token de acento, sin alterar su
  contrato accesible (texto, `aria-label`, área táctil, pestaña nueva).
- Dejar explícito en `AGENTS.md` qué verificación exige este tipo de cambio.

**Non-Goals:**

- No cambiar el comportamiento ni el diseño del panel móvil `#mobile-nav`.
- No añadir una dependencia de UI nueva.
- No añadir pruebas E2E, Playwright, Turso ni de base de datos.

## Decisions

### 1. `DropdownMenu` de `radix-ui` en lugar de un disclosure a mano

El panel móvil existente es un disclosure propio; el menú de usuario es un rol
`menu` con expectativas de teclado más estrictas (Enter/Space abre, flechas
recorren ítems, Home/End, Escape cierra y devuelve el foco, cierre al pulsar
fuera). `radix-ui` ya está instalado y ya se usa para `Dialog`; construir
`components/ui/dropdown-menu.tsx` sobre `DropdownMenuPrimitive` reutiliza ese
comportamiento en lugar de reimplementarlo. Alternativa descartada: replicar el
disclosure móvil, que obligaría a escribir a mano la gestión de foco y teclado
del rol `menu`.

### 2. El disparador es el bloque avatar + nombre, no un botón nuevo

Se conserva el `<div>` de identidad actual convirtiéndolo en el
`DropdownMenuTrigger`, con el avatar, el nombre corto y un chevron `▾`. Así no
se añade un control extra a la barra (que es justo el problema a resolver) y se
mantienen los `data-testid` `auth-avatar` y `auth-user-name` en el disparador.
El nombre visible pasa a ser un `<span>` dentro del botón, por lo que deja de
ser texto suelto.

### 3. Recorte del nombre en una función pura: `lib/user-display-name.ts`

```ts
export function shortDisplayName(name: string | null | undefined, fallback: string): string
```

Regla: tomar el primer segmento separado por espacios y recortarlo a 10
caracteres. Se hace en TypeScript (no solo con CSS) para que el ancho del
disparador sea predecible y para poder probarlo sin DOM. La clase
`max-w-[10ch] truncate` queda como red de seguridad visual.

Justificación de extraerlo: es la única lógica nueva del cambio y permite un
test unitario real en entorno `node`, sin jsdom, sin BD y sin Playwright (el
tipo de verificación que el proyecto exige para este cambio). Meterlo inline en
el componente lo haría solo verificable por E2E.

### 4. Qué queda en la barra y qué entra al menú

Decisión del usuario: la barra conserva marca, "Mis tareas" y "Cómo está
hecha"; el menú contiene exactamente "Tokens MCP" y "Cerrar sesión". Se
descarta mover también "Mis tareas" al menú (opción considerada): escondería la
navegación principal de la app en escritorio. Se descarta también una cabecera
de identidad dentro del menú (nombre completo + correo): el usuario pidió solo
los dos ítems.

### 5. Rango de escritorio y móvil sin tocar

El menú se activa desde `sm` (640 px), el mismo corte que ya usa el
`SignOutButton` de escritorio (`hidden sm:flex`) y el panel móvil
(`sm:hidden`). Por debajo de 640 px no se monta el menú; el panel
`#mobile-nav` sigue siendo la única vía, sin cambios.

### 6. Política de verificación del cambio

`AGENTS.md` §4 hoy solo describe cambios presentacionales y de comportamiento
de datos; un reordenamiento de controles con estado de apertura cae entre
ambos. Se añade una categoría explícita "cambios de UI/interacción sin lógica
de negocio": exige `npm run lint`, `npm run typecheck`, revisión manual del
flujo y test unitario de la lógica pura extraída, y excluye E2E, Playwright,
Turso y bases de datos.

### 7. Destacar el enlace de documentación con el token de acento

El enlace `nav-arquitectura` pasa de `text-muted hover:bg-elevated` a un chip
acentuado:

```
rounded-md border border-accent/25 bg-accent/10 font-medium text-accent
hover:bg-accent/20 hover:text-accent
```

Se usa el token existente `--color-accent` (`#2dffa8`, contraste ≈ 10:1 sobre
`--color-ground`) en lugar de introducir un color nuevo, y la variante
translúcida (`/10`) mantiene la jerarquía frente al CTA principal
("Registrarse" / "Crear tarea"), que va con acento sólido. Alternativas
descartadas: acento solo en el icono o al pasar el ratón (demasiado sutil para
lo pedido) y un botón outline neutro (no destaca). El cambio es de clases
únicamente: **no** toca el texto, el `aria-label`, el icono, el `target`, el
`rel` ni el alto mínimo de 44 px, porque los tests E2E existentes asertan
`toHaveText("Cómo está hecha")`, `aria-label` y área táctil.

## Risks / Trade-offs

- [Mover "Tokens MCP" al menú reduce su visibilidad en escritorio] → Es una vía
  secundaria; "Mis tareas" (la principal) sigue visible y el ítem del menú
  mantiene `nav-mcp` como `data-testid` para no perder trazabilidad.
- [Los specs E2E existentes asumen `auth-signout-btn` y `nav-mcp` visibles en
  la barra de escritorio] → Ajustar solo los selectores/asercciones afectados
  (mantenimiento), sin ejecutar Playwright en este cambio; se documenta como
  tarea aparte para no dar la suite por verde sin comprobarla.
- [El recorte del nombre a 10 caracteres puede dejar un nombre cortado sin
  aviso] → Es el comportamiento pedido; el `title`/`aria-label` del disparador
  conserva el nombre completo como contexto accesible.
- [En el header anónimo el chip acentuado convive con el CTA principal
  "Registrarse"] → El acento del chip es translúcido (`bg-accent/10`), no
  sólido, así que el CTA sigue siendo el elemento dominante; se revisa a ojo en
  la comprobación manual a 640/1024 px.
- [Nueva primitiva de UI que mantener] → Es un wrapper delgado sin lógica
  propia; el comportamiento vive en `radix-ui`.

## Migration Plan

Cambio de UI sin datos: no hay migración ni rollback especial (revertir el
commit). El test unitario nuevo corre con el resto de Vitest.

## Open Questions

Ninguna: el alcance, el contenido del menú y el recorte del nombre quedaron
decididos con el usuario antes de escribir los artefactos.
