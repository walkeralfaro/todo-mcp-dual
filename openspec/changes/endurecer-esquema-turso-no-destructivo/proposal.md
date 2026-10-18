# Proposal

## Why

El deploy en Vercel falla con `Command "npm run build" exited with 1` porque el primer paso del build (`node scripts/apply-schema-turso.mjs --skip-if-missing`) aborta al detectar que la tabla `Task` de la DB Turso de prod es anterior a auth (le falta `userId`). El script solo ofrece dos extremos, y ambos son malos como política permanente: **abortar** (`process.exit(1)`, que bloquea el deploy) o **borrar** (`--recreate-outdated`, que ejecuta `DROP TABLE` dentro de un build automático). Una actualización normal del esquema no debería ni tumbar el deploy ni destruir datos; hace falta una tercera vía.

## What Changes

- `scripts/apply-schema-turso.mjs` deja de ser destructivo: **se elimina todo `DROP TABLE`** y el flag `--recreate-outdated`. El build nunca borra tablas.
- Se mantiene el paso idempotente de creación (`CREATE TABLE/INDEX IF NOT EXISTS`): si una tabla falta, se crea.
- La aplicación de columnas aditivas se generaliza: en vez de la lista hardcodeada de una sola columna (`mcp_token.tokenPrefix`), el script introspecciona cada tabla existente y añade con `ALTER TABLE ... ADD COLUMN` las columnas que falten y sean aplicables sin pérdida (opcionales o con `DEFAULT`).
- Ante una desalineación **no aditiva** (por ejemplo `Task` sin `userId`, que es `NOT NULL` y sin `DEFAULT`), el script **falla alto** con un mensaje que nombra la tabla y las columnas afectadas, sin emitir ningún `DROP TABLE`. El build se detiene de forma visible en lugar de publicar una app que responde 500.
- Se añade una **reparación puntual** para realinear la `Task` legacy de prod: un script one-off con `@libsql/client`, guardado por introspección, que se ejecuta a mano una vez y nunca desde el build.
- Se actualizan `README.md` (Deploy a Vercel + Troubleshooting) y `.env.example` con la nueva política y el procedimiento de reparación.

## Capabilities

### New Capabilities

<!-- Ninguna: no se introduce una capability nueva. -->

### Modified Capabilities

- `turso-environments`: cambia la garantía de esquema en deploy. Pasa de "crear si falta, y abortar o borrar si difiere" a una política no destructiva: crea lo que falta, aplica solo cambios aditivos y falla alto —sin borrar nunca— ante una desalineación estructural.

## Impact

- **Código**: `scripts/apply-schema-turso.mjs` (sin `DROP`, detección y aplicación aditiva generalizadas, fallo alto explícito) y un script one-off de reparación (`scripts/realinear-task-turso.mjs`). `package.json` no cambia: el `build` conserva su forma actual.
- **Documentación**: `README.md` (Deploy a Vercel y Troubleshooting) y `.env.example`.
- **Sistemas**: build de Vercel (Production y Preview) contra Turso; el script también se ejecuta a mano contra Turso test.
- **Transición**: mientras la `Task` de prod no se realinee, el build seguirá fallando. Ese fallo es intencional y visible: es preferible a un build verde con la app en 500. Tras aplicar la reparación puntual, el deploy pasa.
- **Fuera de alcance**: adoptar `prisma/migrations` versionadas con control de aplicadas (la doc de Prisma confirma que `migrate` no alcanza `libsql://`, por lo que la aplicación seguiría necesitando un paso propio), y alinear la DB local `dev.db` (se hace aparte con `prisma db push`).
