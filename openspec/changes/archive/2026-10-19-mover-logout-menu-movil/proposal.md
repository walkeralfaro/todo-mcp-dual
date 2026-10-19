# Proposal: Mover "Cerrar sesión" al menú móvil y reordenar la barra

## Why

Con sesión y ancho móvil (<640 px) el header muestra, de izquierda a derecha,
botón hamburguesa, avatar y "Cerrar sesión". El logout compite por el escaso
ancho de la barra, obliga a comprimir el resto de controles y deja la
hamburguesa a la izquierda del avatar, cuando el patrón habitual es avatar a la
izquierda y menú a la derecha. Mover la acción destructiva al panel desplegable
libera la barra y agrupa las acciones de sesión en un solo sitio.

## What Changes

- En móvil (<640 px), la barra con sesión pasa a mostrar **avatar y, a su
  derecha, la hamburguesa**; el nombre sigue oculto en ese ancho.
- **"Cerrar sesión" sale de la barra en móvil** y pasa al final del panel
  `#mobile-nav`, separado con un borde superior, a ancho completo y con área
  táctil de 44 px.
- El botón del panel usa un `data-testid` propio (`auth-signout-btn-movil`)
  para no duplicar `auth-signout-btn`, que se mantiene en la barra para
  escritorio (≥640 px) y para el resto de pruebas existentes.
- El mensaje de error de cierre de sesión se muestra junto al botón que lo
  provocó: en el panel en móvil y en la barra en escritorio.
- Se actualizan los E2E que cierran sesión a 390 px para abrir primero el menú,
  y se añade cobertura del orden avatar → hamburguesa, de la reubicación del
  logout y del flujo completo de cierre de sesión desde el panel.
- Sin cambios funcionales en escritorio ni en el estado anónimo.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `user-auth-ui`: el requisito "Botones de autenticación en el header" precisa
  cómo se distribuyen los controles de sesión en móvil: avatar en la barra con
  el botón de menú a su derecha, y "Cerrar sesión" dentro del panel móvil,
  manteniendo las áreas táctiles de 44 px y la alcanzabilidad ya exigidas.

## Impact

- **Código**: `components/site-header.tsx` (estructura del bloque de controles
  y del panel `#mobile-nav`).
- **E2E**: `e2e/todo-auth.spec.ts` (logout a 390 px pasa por el menú) y
  `e2e/nav-movil.spec.ts` (orden de la barra, ubicación del logout y flujo de
  cierre de sesión). El resto de specs de escritorio conservan
  `auth-signout-btn` y no cambian.
- **Documentación**: `docs/arquitectura.md` §9.2 y, si procede, regeneración
  del documento interactivo de arquitectura.
- **Specs**: delta en `openspec/specs/user-auth-ui/spec.md`.
- **Sin** cambios en base de datos, API, Server Actions ni tools MCP.
