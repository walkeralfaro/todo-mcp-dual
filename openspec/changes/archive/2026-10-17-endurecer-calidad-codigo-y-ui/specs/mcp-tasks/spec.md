# Spec Delta

## MODIFIED Requirements

### Requirement: Endpoint MCP Streamable HTTP con autenticación Bearer
El sistema SHALL exponer el servidor MCP en la ruta `/api/mcp` mediante Streamable HTTP, exigiendo autenticación mediante un token de acceso válido en la cabecera `Authorization` que resuelva a un `userId` mediante `McpToken`. El `userId` con el que opera cada tool SHALL provenir exclusivamente del token: cualquier `userId` presente en el cuerpo JSON-RPC o en los `arguments` de la invocación SHALL ignorarse.

#### Descubrimiento de herramientas requiere autenticación
- **WHEN** un cliente MCP inicia sesión contra `/api/mcp` sin cabecera `Authorization` o con token inválido
- **THEN** el sistema rechaza la solicitud con error de autenticación

#### Descubrimiento de herramientas con token válido
- **WHEN** un cliente MCP inicia sesión contra `/api/mcp` con `Authorization: Bearer <token>` válido
- **THEN** descubre las 5 herramientas de tareas asociadas al `userId` del token

#### Invocación de tools con token válido
- **WHEN** un cliente MCP invoca `create_task` con título válido y token válido
- **THEN** la tool se ejecuta sobre el `userId` del token y responde con la tarea creada, sin error de autenticación

#### Invocación de tools sin token válido
- **WHEN** un cliente MCP invoca cualquier tool sin cabecera `Authorization` o con token inválido
- **THEN** el sistema rechaza la invocación sin ejecutar la tool

#### Scenario: El usuario de la invocación sale del token, no del cuerpo
- **WHEN** un cliente MCP invoca `create_task` con token válido y añade el `userId` de otro usuario en los `arguments`
- **THEN** la tarea queda asociada al `userId` del token y no se crea ni modifica nada del usuario indicado en el cuerpo

### Requirement: Formato y validación de respuestas MCP
Todas las tools SHALL validar parámetros con Zod (mensajes en español) y responder `{ content: [{ type: 'text', text: '<JSON>' }] }`; los errores de validación se devuelven como texto de error controlado, no como excepción sin formato. La validación y sus mensajes SHALL vivir en `lib/validators.ts`: los esquemas que publica `tools/list` describen tipos y dejan los límites en su descripción, sin repetir las reglas de negocio con textos en otro idioma.

#### Parámetro inválido
- **WHEN** se invoca `create_task` con título vacío y token válido
- **THEN** la respuesta es un error en español sin crear la tarea

#### Título por encima del máximo
- **WHEN** se invoca `create_task` con un título de 101 caracteres y token válido
- **THEN** la respuesta en español indica el máximo de 100 caracteres y no se crea la tarea

#### Error de autenticación
- **WHEN** se invoca cualquier tool MCP sin token válido
- **THEN** la respuesta es un error de autenticación en español
