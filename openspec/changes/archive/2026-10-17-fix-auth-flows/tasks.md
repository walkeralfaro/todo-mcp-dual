# Tasks

## 1. Reparar la resolución de sesión en el servidor

- [x] 1.1 En `app/page.tsx`: sustituir el ensamblado manual de headers por `auth.api.getSession({ headers: await headers() })` (import de `next/headers`) y verificar con `npm test` que los tests de página/acciones siguen pasando
- [x] 1.2 En `app/actions.ts`: aplicar el mismo patrón en `currentUserId()` y verificar `npx vitest run app/actions.test.ts` en verde
- [x] 1.3 Verificar manualmente (o con curl + cookie) que con sesión válida la página principal renderiza el formulario de creación y que una Server Action de crear/editar/borrar ya no responde "No autenticado"

## 2. Esquema de auth reparable e idempotente

- [x] 2.1 Generalizar el post-proceso de `scripts/apply-schema-turso.mjs` para que todo `CREATE TABLE`/`CREATE INDEX` del DDL generado quede `IF NOT EXISTS` (no solo `Task`) y verificar regenerando el DDL con `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`
- [x] 2.2 Ejecutar `node scripts/apply-schema-turso.mjs` contra la DB de test Turso (credenciales de `.env`) y verificar que el registro ya no responde 500 (`no such table: main.user` desaparece)
- [x] 2.3 Verificar idempotencia re-ejecutando el script dos veces seguidas sin error

## 3. Manejo de errores del cliente de Better Auth en español

- [x] 3.1 Crear helper `authErrorToMessage` (p. ej. en `lib/`) que mapee códigos de Better Auth (`INVALID_EMAIL_OR_PASSWORD`, `PASSWORD_TOO_SHORT`, `USER_ALREADY_EXISTS`, ...) a mensajes en español con fallback genérico; añadir unit test del helper y verificar `npx vitest run lib/` en verde
- [x] 3.2 En `auth-modal.tsx`: consumir el `{ error }` de `signIn.email`/`signUp.email` (sin `try/catch` HTTP), mostrar el mensaje del helper y no llamar `onAuthSuccess` si hay error; verificar `npx vitest run components/` (si aplica al componente) y que el flujo manual muestra el error sin cerrar el modal
- [x] 3.3 Corregir la duplicación: un único `FieldError` para el mensaje de error (fuera de los dos campos o solo en email) con `data-testid="auth-error"` único; verificar que solo hay un `auth-error` en el DOM tras un fallo
- [x] 3.4 En `lib/auth.ts`: fijar `emailAndPassword.minPasswordLength: 8` y en la UI usar `minLength={8}` + "Mínimo 8 caracteres"; verificar que un registro con 6 caracteres muestra el mensaje en español y el modal sigue abierto

## 4. UX del modal y transición de sesión

- [x] 4.1 Elevar el estado del tab a `SessionDisplay` (`tab` + `onTabChange`) y que `AuthModal` sea controlado; verificar que clic en "Iniciar sesión"/"Registrarse" del header abre la pestaña correcta incluso tras abrir/cerrar el modal antes (repro del bug revisado con playwright-cli)
- [x] 4.2 Limpiar error y campos al cerrar el modal (el spec pide conservarlos entre pestañas y tras fallo, no entre aperturas); verificar reabriendo el modal tras cerrarlo
- [x] 4.3 En `onAuthSuccess` y en `handleSignOut` añadir `router.refresh()` para que el RSC refleje la sesión; verificar con playwright-cli que tras registrar/iniciar sesión aparece el formulario y tras cerrar sesión desaparece sin recarga manual
- [x] 4.4 Estado pendiente en "Cerrar sesión" (deshabilitar botón mientras se cierra) con manejo de error igual que el modal; verificar que un segundo clic durante la transición no rompe nada
- [x] 4.5 Añadir botón "Continuar con Google" (separador "o continúa con") que invoque `authClient.signIn.social({ provider: "google", callbackURL: "/" })`; verificar el redirect a Google con credenciales válidas y que el botón se muestra en ambas pestañas
- [x] 4.6 Eliminar el `DialogTrigger` oculto (`<span style={{display:"none"}}>`), ajustar `autoComplete` del email de registro a `email` y actualizar el estado vacío sin sesión a "Inicia sesión para crear tareas"; verificar con snapshot de playwright-cli el modal limpio y el copy correcto

## 5. E2E alineado con la UI real

- [x] 5.1 Añadir `data-testid="auth-email"` y `"auth-password"` a los inputs del modal y verificar que `e2e/todo-auth.spec.ts` localiza los campos sin cambiar los tests existentes
- [x] 5.2 En `e2e/todo-auth.spec.ts`: eliminar el `page.reload()` tras registrarse (ya no necesario con `router.refresh()`) y verificar que el flujo registro→crear tarea→cerrar sesión pasa en verde
- [x] 5.3 Ampliar el E2E: contraseña incorrecta muestra error en español con modal abierto, contraseñas cortas muestran mensaje de longitud mínima, cambio de pestañas conserva valores, y cerrar sesión oculta el formulario sin recarga; verificar `npx playwright test e2e/todo-auth.spec.ts` en verde
- [x] 5.4 Ejecutar la suite completa (`npm test` + E2E con Turso de test) y verificar que ambos quedan en verde sin errores de tipos (`npx tsc --noEmit`)
