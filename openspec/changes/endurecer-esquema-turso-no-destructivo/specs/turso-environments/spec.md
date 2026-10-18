# Spec Delta: turso-environments

## MODIFIED Requirements

### Requirement: Esquema inicial vacío en Turso
El sistema SHALL crear las tablas del esquema Prisma (incluidas `Task` y las de auth) en cada DB Turso aplicando el DDL generado por Prisma (`migrate diff --script`) con el cliente libsql, partiendo vacías y sin importar datos de `dev.db`.

#### Scenario: Push crea tabla vacía en test
- **WHEN** se aplica el DDL de Prisma contra la URL de test
- **THEN** las tablas del esquema existen y `list_tasks` devuelve lista vacía

### Requirement: Creación automática en deploy
El sistema SHALL garantizar en cada deploy el esquema alineado con `prisma/schema.prisma` ejecutando el DDL idempotente (`IF NOT EXISTS`) como parte del build cuando haya credenciales Turso, sin pasos manuales. El sistema SHALL añadir automáticamente las columnas aditivas que falten (opcionales o con `DEFAULT`) sin borrar tablas ni filas, y SHALL fallar alto, sin emitir `DROP TABLE`, cuando la desalineación no sea aplicable de forma aditiva.

#### Scenario: Deploy sin tabla la crea
- **WHEN** se despliega a Vercel contra una DB sin tabla `Task`
- **THEN** el build crea la tabla y la home responde 200 en vez de 500

#### Scenario: Actualización aditiva se aplica sin pérdida
- **WHEN** se despliega contra una DB cuya tabla gestionada existe pero le falta una columna que el esquema define como opcional o con `DEFAULT`
- **THEN** el build añade la columna con `ALTER TABLE` sin borrar la tabla ni sus filas y el build continúa

#### Scenario: Desalineación estructural aborta sin borrar
- **WHEN** se despliega contra una DB cuya tabla `Task` carece de una columna obligatoria (`userId`)
- **THEN** el build falla con un mensaje que nombra la tabla y las columnas afectadas, sin emitir ningún `DROP TABLE` ni modificar la tabla

#### Scenario: Esquema alineado no se toca
- **WHEN** se ejecuta el build contra una DB cuyas tablas ya tienen las columnas esperadas
- **THEN** el script no emite ningún `DROP TABLE` ni altera las tablas existentes, y el build continúa sin cambios

#### Scenario: Build local sin Turso no se interrumpe
- **WHEN** se ejecuta el build sin `TURSO_DATABASE_URL` definida
- **THEN** el paso de esquema se omite con aviso y el build continúa igual que antes
