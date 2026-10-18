# Design

## Context

Ver `proposal.md` — Why. Estado actual relevante:

- El `build` corre `node scripts/apply-schema-turso.mjs --skip-if-missing && prisma generate && next build`; el paso de esquema abre la DB Turso con `@libsql/client`.
- El DDL se sintetiza con `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` (Prisma es la fuente de verdad) y se post-procesa a `CREATE TABLE/INDEX IF NOT EXISTS`.
- La comparación de alineación ya existe: por cada `CREATE TABLE`, el script lee `PRAGMA table_info` y compara el conjunto de nombres de columnas ordenados contra el esperado. Hoy, si difiere, imprime las tablas y hace `process.exit(1)`, salvo con `--recreate-outdated`, que ejecuta `DROP TABLE` + `CREATE TABLE`.
- `prisma migrate` / `prisma db push` necesitan una conexión directa y no alcanzan `libsql://` (el `P1012` ya documentado en el repo; la guía de Prisma confirma que migrate/introspection no soportan URLs de tipo proxy). El flujo oficial de Turso es generar migraciones localmente contra un SQLite `file:` y aplicar el SQL a la remota a mano.
- El repo no tiene `prisma/migrations/` y la Turso CLI no está instalada en la máquina de desarrollo; los scripts del repo usan `@libsql/client` directamente.
- La tabla `Task` de prod es anterior a auth: le falta `userId`, que el esquema define como `NOT NULL` sin `DEFAULT`. Ese es el drift que bloquea el deploy.
- `--skip-if-missing` mantiene verdes los builds locales sin `TURSO_*`. `scripts/clean-turso-test.mjs` limpia la DB de test con retry, sin recrear tablas.

## Goals / Non-Goals

**Goals:**
- Que el build aplique el esquema Turso **sin destruir datos**: crear lo que falte y aplicar solo los cambios aditivos.
- Que una desalineación que no se pueda resolver de forma aditiva produzca un fallo explícito y accionable, nunca un `DROP` ni un build verde con la app rota.
- Dejar el script en un núcleo exportado y probable de forma hermética, sin depender de la red.

**Non-Goals:**
- Adoptar `prisma/migrations` versionadas con control de aplicadas.
- Reparar automáticamente el drift estructural (la `Task` legacy se realinea a mano, una vez).
- Alinear la DB local `dev.db` (se hace aparte con `prisma db push`).
- Cambiar `prisma/schema.prisma`, `package.json` (`build` conserva su forma) o el modelo de datos.

## Decisions

1. **El script sigue siendo el vehículo de aplicación.** `prisma migrate` no alcanza `libsql://`, así que el DDL se aplica vía `@libsql/client`, con `migrate diff --script` como fuente de verdad. Alternativa considerada y descartada en este cambio: adoptar `prisma/migrations` como fuente y empujar las pendientes a Turso (implica `prisma.config.ts`, un control de aplicadas y un aplicador propio; no elimina el paso no-oficial, solo lo mueve).

2. **Política no destructiva: nunca `DROP TABLE`.** El script deja de tener cualquier camino de borrado y se retira `--recreate-outdated`. Alternativas descartadas: (a) recomposición destructiva automática en el build (la elección previa, revertida por el usuario: borraría datos en cada actualización); (b) dejar el drift solo avisando (produce build verde con la app en 500 por columnas que Prisma espera y no existen).

3. **Aplicación aditiva generalizada y derivada del DDL.** En vez de la lista hardcodeada actual (una sola columna), el script compara las columnas de cada tabla existente contra el `CREATE TABLE` esperado y emite `ALTER TABLE ... ADD COLUMN` solo para las columnas faltantes cuya definición permite añadirlas sin pérdida (nullable o con `DEFAULT`). Alternativa descartada: mantener la lista hardcodeada, que obliga a tocar el script en cada columna nueva y no cubre las que no se declaren.

4. **El drift no aditivo falla alto con diagnóstico.** Si tras el paso aditivo una tabla sigue desalineada (o una columna falta y es `NOT NULL` sin `DEFAULT`, como `Task.userId`), el script imprime la tabla y las columnas afectadas y termina con código de error, sin modificar la tabla y sin emitir `DROP`. El mensaje apunta al procedimiento de reparación del README.

5. **Reparación puntual de prod fuera del build.** La `Task` legacy se realinea con un script one-off (`scripts/realinear-task-turso.mjs`) que: verifica por introspección que falta `userId` (si no, no hace nada), cuenta las filas y, con 0 filas, recompone la tabla con el esquema actual; con filas, exige `--accept-loss` explícito porque no hay usuarios a los que asignar un `userId`. Se ejecuta a mano contra prod y nunca desde el `build`. Alternativa descartada: `turso db shell` (la Turso CLI no está instalada y el repo ya usa `@libsql/client`).

6. **Núcleo exportado para probarlo sin Turso.** La lógica se expone como `applySchema({ url, authToken, log })` y el CLI queda como capa fina que resuelve `TURSO_*`, aplica `--skip-if-missing` y conserva el guard de URL `libsql://`. Así el comportamiento (crear, añadir, abortar) se prueba de forma hermética contra una DB `file:` temporal. Alternativa descartada: probar contra la DB de Turso de test, que es intrusivo y puede dejarla en un estado inconsistente si el test falla a mitad.

7. **Trazabilidad proporcional al riesgo.** El script registra qué tablas y columnas creó o añadió; al abortar, nombra la tabla y las columnas que lo provocan. Sin borrados no hay pérdida de datos que auditar, así que no se mantiene un registro de recomposiciones.

## Risks / Trade-offs

- **[Se añade una columna obligatoria sin `DEFAULT` y el build empieza a fallar]** → Es el comportamiento buscado: el fallo es explícito y nombra la columna; se resuelve con una migración manual con backfill, no borrando.
- **[La detección compara nombres de columna, no tipos ni constraints]** → Límite aceptado: un cambio de tipo o de FK sin cambio de columnas no se detecta. El DDL se regenera completo desde el schema, así que este proyecto no genera ese drift hoy.
- **[El deploy queda rojo hasta aplicar la reparación puntual]** → Intencional y visible; el mensaje del script y el README indican exactamente cómo hacerlo. Mejor que un build verde con la app en 500.
- **[La reparación puntual se ejecuta contra la DB equivocada]** → El guard por introspección (solo actúa si falta `userId`) y el `--accept-loss` obligatorio cuando hay filas limitan el daño; el script imprime el conteo antes y después.
- **[Dos builds concurrentes (Production y Preview) contra la misma DB]** → La operación es idempotente y solo aditiva; el peor caso es repetir un `ALTER TABLE` que ya está aplicado, que la introspección evita.

## Migration Plan

1. Implementar el script no destructivo (núcleo exportado + CLI) y su test hermético; verificar `grep` sin `DROP TABLE` y con los tests en verde.
2. Verificar el camino sin credenciales: `npm run build` local sin `TURSO_*` omite el paso con aviso y continúa.
3. Ejecutar contra Turso test (`node --env-file=.env scripts/apply-schema-turso.mjs`) y comprobar que es no-op (test ya alineada).
4. Reparar prod una vez: `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/realinear-task-turso.mjs` y verificar que `Task` ya tiene `userId`.
5. Merge a `main` y deploy: el build pasa y la home responde 200.
6. Verificar prod: `list_tasks` operativo y `PRAGMA table_info('Task')` con `userId`.

**Rollback:** revertir el commit. El script anterior volvería a fallar alto si el esquema estuviera desalineado, pero tras el paso 4 prod queda alineado, así que revertir no rompe el deploy.

## Open Questions

- ¿Preview y Production comparten la misma DB Turso? Si sí, un build de preview toca el esquema de prod. Es deferible: con la política no destructiva el riesgo es mucho menor (solo creaciones y columnas aditivas), y se resuelve con credenciales distintas por entorno si llega a importar.
- ¿Cuándo migrar a `prisma/migrations` versionadas? Deferible mientras las actualizaciones sean aditivas; se revisará si aparece un drift estructural recurrente que obligue a más reparaciones puntuales.
