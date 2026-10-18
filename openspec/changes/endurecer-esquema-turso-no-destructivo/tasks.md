# Tasks

## 1. Script de esquema no destructivo

- [x] 1.1 Extraer el núcleo del script a una función exportada `applySchema({ url, authToken, log })` (DDL vía `prisma migrate diff`, post-proceso `IF NOT EXISTS`, introspección y batch) y dejar el CLI como capa fina que resuelve `TURSO_*`, aplica `--skip-if-missing` y conserva el guard de URL `libsql://`. Verificación: el script sin `TURSO_*` imprime el aviso de omisión y sale 0, y `npm run typecheck` pasa sin errores.
- [x] 1.2 Eliminar todo camino destructivo (`DROP TABLE` y el flag `--recreate-outdated`) conservando `CREATE TABLE/INDEX IF NOT EXISTS`, y crear `scripts/apply-schema-turso.test.ts` con una DB libsql `file:` temporal (sin Turso) que afirme: tabla ausente → se crea; esquema alineado → no-op. Verificación: `npx vitest run scripts/apply-schema-turso.test.ts` en verde y `grep -c "DROP TABLE\|recreate-outdated" scripts/apply-schema-turso.mjs` devuelve 0.
- [x] 1.3 Generalizar la aplicación aditiva derivada del DDL esperado (sustituyendo la lista hardcodeada de `mcp_token.tokenPrefix`): añadir con `ALTER TABLE ... ADD COLUMN` las columnas faltantes que sean opcionales o tengan `DEFAULT`. Verificación: el test cubre (a) una tabla a la que le falta una columna nullable → se añade sin perder filas, y (b) `mcp_token` sin `tokenPrefix` → mismo resultado que con la lista hardcodeada.
- [x] 1.4 Hacer que la desalineación no aditiva falle alto con diagnóstico (tabla y columnas) sin emitir DDL alguno. Verificación: el test siembra una `Task` legacy de 6 columnas con 1 fila y comprueba que `applySchema` falla, que la tabla conserva sus columnas y su fila, y que el mensaje nombra `Task` y `userId`.

## 2. Reparación puntual y documentación

- [x] 2.1 Crear `scripts/realinear-task-turso.mjs` (one-off, nunca desde el build): guard por introspección (solo actúa si `Task` existe y le falta `userId`), conteo de filas antes y después, recomposición con el DDL actual y `--accept-loss` obligatorio cuando hay filas. Verificación: sobre una copia `file:` con `Task` legacy y 0 filas deja `Task` con `userId`; sobre una copia con filas y sin `--accept-loss` se niega sin modificar nada.
- [x] 2.2 Documentar en `README.md` (secciones "Deploy a Vercel" y Troubleshooting) y `.env.example` la política no destructiva del build, el procedimiento de reparación puntual y la retirada del flag `--recreate-outdated`. Verificación: la guía se reproduce tal cual con `TURSO_*` en el entorno y no menciona ningún flag ni paso obsoleto.

## 3. Verificación de integración

- [x] 3.1 Ejecutar la verificación completa del repo: `npm run lint`, `npm run typecheck`, `npm test` y `npm run test:e2e` (puerto 3000 libre). Verificación: las cuatro órdenes terminan en verde.
- [x] 3.2 Ejecutar `node --env-file=.env scripts/apply-schema-turso.mjs` contra Turso test y confirmar la idempotencia sobre un esquema ya alineado. Verificación: termina en `OK esquema aplicado. Task count=` sin errores y sin DDL inesperado.
- [ ] 3.3 Reparar prod y desplegar: ejecutar `scripts/realinear-task-turso.mjs` contra Turso prod, mergear a `main` y comprobar el deploy. Verificación: el build de Vercel termina en verde, `PRAGMA table_info('Task')` de prod incluye `userId` y la home responde 200.
