# Tasks

## 1. Componentes de UI de autenticación

- [x] 1.1 Crear `components/ui-auth/session-display.tsx`: muestra avatar/nombre + "Cerrar sesión" con sesión; botones "Iniciar sesión"/"Registrarse" sin sesión; verificar que se renderiza sin errores de tipos
- [x] 1.2 Crear `components/ui-auth/auth-modal.tsx`: modal único (Dialog shadcn) con pestañas "Iniciar sesión" y "Registrarse", campos email + contraseña, usando `useSession` de Better Auth; verificar que abre/cierra y cambia pestañas
- [x] 1.3 Integrar `session-display` en el header de `app/page.tsx` junto a `DayHeadline`; verificar que muestra botones de entrada sin sesión y avatar/cerrar sesión con sesión

## 2. Restricción de creación de tareas por sesión

- [x] 2.1 Actualizar `app/page.tsx` para resolver sesión (Better Auth, `SessionProvider` en `layout.tsx` o lectura por props) y montar `TaskForm` solo si hay sesión autenticada; verificar que sin sesión no se renderiza el formulario de creación
- [x] 2.2 Filtrar `listTasks` por `userId` del usuario autenticado en `page.tsx` para que el listado y el titular del día reflejen solo las tareas del usuario; verificar aislamiento por usuario

## 3. Pruebas E2E y validación de UX

- [x] 3.1 Añadir prueba E2E en `e2e/todo-auth.spec.ts`: sin sesión no aparece formulario de crear; abrir modal, registrarse/iniciar sesión, crear tarea, verificar que aparece; cerrar sesión, verificar que vuelve al estado sin sesión
- [~] 3.2 Validar UX con `playwright-cli`: `open`, `goto`, `snapshot`, `click`, `type`, `find` para verificar flujo de login/registro y cierre de sesión en desktop y móvil — BLOQUEADO: Chromium no disponible (sin sudo para instalarlo); playwright-cli no puede ejecutarse en este entorno
- [x] 3.3 Verificar que `tsc --noEmit` y `next build` pasan sin errores tras los cambios de UI

## 4. Documentación del cambio

- [x] 4.1 Documentar en el cambio (`API.md` o sección en `README`) los nuevos componentes UI-auth, el flujo de registro abierto y cómo se resuelve la sesión en el frontend
