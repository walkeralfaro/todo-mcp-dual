# Tasks

## 1. Barra móvil: avatar + hamburguesa y logout en el panel

- [x] 1.1 Extraer un componente `SignOutButton` a nivel de módulo en `components/site-header.tsx` con props `testId`, `className`, `disabled`, `busy` y `onClick`, reutilizando `handleSignOut`, `signingOut` y `signOutError` de `SiteHeader`; verificar con `npm run lint` y `npm run typecheck`
- [x] 1.2 Reordenar el contenedor de controles para que el bloque de sesión quede antes del wrapper de la hamburguesa, envolver el botón `auth-signout-btn` en un contenedor `hidden … sm:flex` (para que no sea visible ni enfocable por debajo de `sm`) y dejar el error de la barra con `hidden sm:inline`; verificar con `npm run lint` y `npm run typecheck`
- [x] 1.3 Añadir al final del panel `#mobile-nav` el cierre de sesión con `data-testid="auth-signout-btn-movil"`, separador `border-t`, ancho completo, `h-11`, color destructivo, estado "Cerrando sesión…" y su mensaje de error dentro del panel; verificar en `playwright-cli` a 390 px que la barra muestra avatar + hamburguesa, el botón no aparece en la barra y el del panel cumple 44 × 44 px
- [x] 1.4 Ampliar `e2e/nav-movil.spec.ts` para comprobar que la hamburguesa queda a la derecha del avatar, que `auth-signout-btn-movil` está oculto con el panel cerrado y visible con área táctil al abrirlo, y que Escape y el clic fuera siguen cerrando el panel; verificar con `npm run test:e2e -- e2e/nav-movil.spec.ts`

## 2. Flujo de cierre de sesión desde el panel móvil

- [x] 2.1 Actualizar `e2e/todo-auth.spec.ts` (líneas 54-58) para abrir el menú a 390 px antes de comprobar y pulsar `auth-signout-btn-movil`; verificar con `npm run test:e2e -- e2e/todo-auth.spec.ts`
- [x] 2.2 Añadir al test móvil de `e2e/nav-movil.spec.ts` el cierre de sesión real desde el panel al final del flujo, comprobando la llegada a la landing anónima y que el panel desaparece; verificar con `npm run test:e2e -- e2e/nav-movil.spec.ts`
- [x] 2.3 Comprobar que `auth-signout-btn` sigue funcionando en el resto de specs de escritorio (`e2e/todo.spec.ts`, `e2e/proteccion.spec.ts`, `e2e/mcp-tokens.spec.ts`, `e2e/arquitectura.spec.ts`) sin cambios en ellos; verificar con `npm run test:e2e -- e2e/todo.spec.ts e2e/proteccion.spec.ts e2e/mcp-tokens.spec.ts e2e/arquitectura.spec.ts`

## 3. Documentación

- [x] 3.1 Actualizar `docs/arquitectura.md` §9.2 (navbar compartida) describiendo el orden avatar → hamburguesa en móvil, el cierre de sesión dentro del panel `#mobile-nav` y su `data-testid="auth-signout-btn-movil"`; verificar que el apartado refleja el comportamiento real del header a 390 px
- [x] 3.2 Si el documento interactivo `docs/arquitectura-todo-mcp.html` describe la barra, regenerarlo con `archify` y publicar con `npm run prebuild`; verificar que `public/arquitectura.html` queda actualizado y que el enlace `/arquitectura` sigue sirviéndose con `npm run test:e2e -- e2e/arquitectura.spec.ts`

## 4. Verificación integral

- [x] 4.1 Ejecutar la suite completa (`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`) y confirmar que no hay regresiones ni locators estrictos duplicados
- [x] 4.2 Validar el cambio con `openspec validate mover-logout-menu-movil --strict` y confirmar que no quedan controles del header recortados ni scroll horizontal a 390/640/1024 px
