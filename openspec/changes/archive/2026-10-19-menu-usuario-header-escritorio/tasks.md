# Tasks

## 1. Lógica pura del nombre y su test unitario

- [x] 1.1 Crear `lib/user-display-name.ts` con `shortDisplayName(name, fallback)`: primer segmento separado por espacios, recortado a 10 caracteres; verificar con `npm run lint`
- [x] 1.2 Crear `lib/user-display-name.test.ts` (Vitest, entorno `node`, sin BD) cubriendo primer nombre con apellidos, nombre de más de 10 caracteres, `null`/`undefined` con cadena de respaldo y cadena vacía; verificar ejecutando solo `npx vitest run lib/user-display-name.test.ts`

## 2. Primitiva de menú desplegable

- [x] 2.1 Crear `components/ui/dropdown-menu.tsx` como wrapper de `DropdownMenu` de `radix-ui`, al estilo de `components/ui/dialog.tsx` (sin lógica de negocio); verificar con `npm run lint` y `npm run typecheck`

## 3. Header de escritorio

- [x] 3.1 En `components/site-header.tsx`, convertir el bloque avatar + nombre en el disparador del menú: conservar `auth-avatar` y `auth-user-name`, añadir `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, chevron `▾` y el nombre vía `shortDisplayName`; verificar con `npm run typecheck`
- [x] 3.2 Añadir al menú los ítems "Tokens MCP" (`nav-mcp`) y "Cerrar sesión" (`auth-signout-btn`) y retirarlos de la barra de escritorio, con área de interacción ≥44 px y foco visible; verificar en el código que la barra con sesión queda con marca, "Mis tareas", disparador y "Cómo está hecha"
- [x] 3.3 Mostrar el error de cierre de sesión dentro del menú, cerrar el menú al cerrar sesión con éxito y dejar intacto el panel móvil `#mobile-nav`; verificar que el menú y el panel siguen anclados a sus puntos de corte (`sm:flex` / `sm:hidden`)
- [x] 3.4 Destacar el enlace "Cómo está hecha" (`nav-arquitectura`) con el chip de acento (`border border-accent/25 bg-accent/10 font-medium text-accent hover:bg-accent/20 hover:text-accent`), sin cambiar texto, `aria-label`, icono, `target`, `rel` ni el alto mínimo de 44 px; verificar que el nombre accesible sigue siendo "Cómo está hecha" y que no desborda de 640 a 1024 px

## 4. Documentación y gobernanza

- [x] 4.1 Actualizar `AGENTS.md` §4 con la categoría "cambios de UI/interacción sin lógica de negocio" (reubicar controles, menús, estados de apertura): exige `npm run lint`, `npm run typecheck`, revisión manual y test unitario de la lógica pura extraída; excluye E2E, Playwright, Turso y bases de datos; verificar leyendo la sección
- [x] 4.2 Añadir en `requirement.md` una nota del menú de usuario en el header de escritorio ("Tokens MCP" y "Cerrar sesión" dentro del menú); verificar coherencia con la spec `user-auth-ui`

## 5. Verificación del conjunto

- [x] 5.1 Ejecutar `npm run lint` y `npm run typecheck` sobre el árbol completo
- [x] 5.2 Ejecutar solo `npx vitest run lib/user-display-name.test.ts` (sin la suite completa, sin Turso ni BD)
- [x] 5.3 Revisión manual con el dev server si el entorno está disponible: a 640, 768, 1024 y 1440 px con sesión el menú abre y cierra (Escape devuelve el foco, clic fuera cierra) sin desbordar la barra; a 390 px el panel móvil sigue intacto
- [x] 5.4 Validar con `openspec validate menu-usuario-header-escritorio --strict`
