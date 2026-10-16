# Tasks

## 1. Entorno test en Turso

- [x] 1.1 Verificar `.env` local con `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` de test (sin valores de prod) y verificar con `grep -c TURSO .env` que existen sin mostrar secretos
- [x] 1.2 Aplicar esquema a Turso-test con `scripts/apply-schema-turso.mjs` (DDL de `migrate diff` vía libsql) y verificar que `Task` existe vacía (listado devuelve 0 tareas)
- [x] 1.3 Actualizar `.env.example` con nombres `TURSO_*` + nota test-vs-prod y verificar que no contiene URLs ni tokens reales

## 2. Harness Vitest contra Turso

- [x] 2.1 Crear helper de cliente de test (libsql + `PrismaLibSQL`) con limpieza `DELETE FROM Task` y verificar que `beforeEach` deja conteo en 0
- [x] 2.2 Migrar `lib/tasks.test.ts` al helper y verificar con `npm test -- tasks.test.ts` en verde contra Turso-test
- [x] 2.3 Migrar `lib/mcp.test.ts` al helper y verificar con `npm test -- mcp.test.ts` en verde contra Turso-test

## 3. Playwright E2E contra Turso

- [x] 3.1 Reconfigurar `playwright.config.ts` (webServer sin `rm -f`, con `TURSO_*` de test + limpieza de tabla) y verificar que arranca en puerto 3000
- [x] 3.2 Ejecutar `npx playwright test` completo y verificar flujo crear/filtrar/editar/completar/borrar en verde sin tocar prod

## 4. Prod Vercel

- [ ] 4.1 Configurar `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` de prod en dashboard Vercel (Production/Preview) y verificar que aparecen definidas sin exponer valores en el repo
- [ ] 4.2 Aplicar esquema a Turso-prod con `scripts/apply-schema-turso.mjs` y verificar tabla `Task` vacía sin alterar conteo de test
- [x] 4.3 Documentar pasos de deploy (envs + push + build `prisma generate && next build`) en `README.md`/docs y verificar que los comandos documentados corren como están escritos

## 5. Verificación integrada

- [x] 5.1 Ejecutar `npm test` + `npx playwright test` seguidos contra Turso-test y verificar todo verde con prod intacta
