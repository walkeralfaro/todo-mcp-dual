# Spec Delta

## Purpose

Permite ejecutar pruebas y producción contra Turso remoto con entornos separados (test vs prod), partiendo de esquema vacío y con aislamiento por limpieza de tablas.

## ADDED Requirements

### Requirement: Selección de cliente por entorno
El sistema SHALL usar el adapter libsql (`@libsql/client` + `@prisma/adapter-libsql`) cuando existan `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, y SQLite en archivo vía `DATABASE_URL` en caso contrario.

#### Scenario: Runtime usa Turso cuando hay credenciales
- **WHEN** `TURSO_DATABASE_URL` está definida al arrancar la app
- **THEN** toda lectura/escritura de tareas va a Turso y no a ningún archivo local

#### Scenario: Fallback local sin Turso
- **WHEN** no hay `TURSO_DATABASE_URL` definida
- **THEN** el sistema usa `DATABASE_URL` (por defecto `file:../dev.db`)

### Requirement: Esquema inicial vacío en Turso
El sistema SHALL crear la tabla `Task` en cada DB Turso aplicando el DDL generado por Prisma (`migrate diff --script`) con el cliente libsql, partiendo vacía y sin importar datos de `dev.db`.

#### Scenario: Push crea tabla vacía en test
- **WHEN** se aplica el DDL de Prisma contra la URL de test
- **THEN** la tabla `Task` existe y `list_tasks` devuelve lista vacía

### Requirement: Creación automática en deploy
El sistema SHALL garantizar el esquema en cada deploy ejecutando el DDL idempotente (`IF NOT EXISTS`) como parte del build cuando haya credenciales Turso, sin requerir pasos manuales.

#### Scenario: Deploy sin tabla la crea
- **WHEN** se despliega a Vercel contra una DB sin tabla `Task`
- **THEN** el build crea la tabla y la home responde 200 en vez de 500

#### Scenario: Build local sin Turso no se interrumpe
- **WHEN** se ejecuta el build sin `TURSO_DATABASE_URL` definida
- **THEN** el paso de esquema se omite con aviso y el build continúa igual que antes

### Requirement: Aislamiento de pruebas por limpieza de tablas
Cada test SHALL partir de un estado limpio mediante `DELETE FROM Task`, sin borrar ni recrear la base de datos.

#### Scenario: Tests no se contaminan entre sí
- **WHEN** un test crea tareas y termina
- **THEN** el siguiente test observa cero tareas previas

#### Scenario: Sin ficheros efímeros en remoto
- **WHEN** corre Vitest o Playwright contra Turso
- **THEN** no se ejecuta `rm -f *.db` ni se crean archivos SQLite locales para ese run

### Requirement: Separación test/prod
Ningún test SHALL conectarse a la DB de prod; Vitest, Playwright y dev local usan solo credenciales de test, y Vercel usa solo credenciales de prod.

#### Scenario: Suite verde no toca prod
- **WHEN** se ejecuta `npm test` y `npx playwright test` con credenciales de test
- **THEN** la DB de prod conserva íntegro su conteo de tareas

#### Scenario: Prod solo en Vercel
- **WHEN** la app corre desplegada en Vercel
- **THEN** usa exclusivamente su par URL/token de prod configurado en el dashboard

### Requirement: Secretos fuera del repo
Las URLs y tokens de Turso SHALL vivir en `.env` local (gitignored) y en variables de Vercel, nunca commiteados; `.env.example` solo documenta nombres sin valores reales.

#### Scenario: Repo sin secretos
- **WHEN** se inspecciona el repo commiteado
- **THEN** no aparece ningún `libsql://` ni token, y `.env.example` solo muestra placeholders
