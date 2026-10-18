# mcp-tasks Specification

## Purpose

Expone las tareas a agentes IA externos mediante un servidor MCP con 5 herramientas CRUD validadas sobre la misma base de datos que la UI.

## Requirements

### Requirement: Endpoint MCP Streamable HTTP con autenticación Bearer
El sistema SHALL exponer el servidor MCP en la ruta `/api/mcp` mediante Streamable HTTP, exigiendo autenticación mediante un token de acceso válido en la cabecera `Authorization` que resuelva a un `userId` mediante `McpToken`. El `userId` con el que opera cada tool SHALL provenir exclusivamente del token: cualquier `userId` presente en el cuerpo JSON-RPC o en los `arguments` de la invocación SHALL ignorarse.

#### Scenario: Descubrimiento de herramientas requiere autenticación
- **WHEN** un cliente MCP inicia sesión contra `/api/mcp` sin cabecera `Authorization` o con token inválido
- **THEN** el sistema rechaza la solicitud con error de autenticación

#### Scenario: Descubrimiento de herramientas con token válido
- **WHEN** un cliente MCP inicia sesión contra `/api/mcp` con `Authorization: Bearer <token>` válido
- **THEN** descubre las 5 herramientas de tareas asociadas al `userId` del token

#### Scenario: Invocación de tools con token válido
- **WHEN** un cliente MCP invoca `create_task` con título válido y token válido
- **THEN** la tool se ejecuta sobre el `userId` del token y responde con la tarea creada, sin error de autenticación

#### Scenario: Invocación de tools sin token válido
- **WHEN** un cliente MCP invoca cualquier tool sin cabecera `Authorization` o con token inválido
- **THEN** el sistema rechaza la invocación sin ejecutar la tool

#### Scenario: El usuario de la invocación sale del token, no del cuerpo
- **WHEN** un cliente MCP invoca `create_task` con token válido y añade el `userId` de otro usuario en los `arguments`
- **THEN** la tarea queda asociada al `userId` del token y no se crea ni modifica nada del usuario indicado en el cuerpo

### Requirement: Tool list_tasks con guardrails y aislamiento por usuario
La tool `list_tasks` SHALL aceptar `estado`, `q`, `limit` (default 50, max 100) y `offset` (default 0), devolviendo tareas en JSON dentro de `content[0].text` ordenadas por fechaCreacion desc, filtradas por el `userId` resuelto del token de autenticación.

#### Listado por defecto limitado
- **WHEN** se invoca `list_tasks` sin parámetros con token válido
- **THEN** devuelve hasta 50 tareas del usuario autenticado ordenadas de más reciente a más antigua

#### Límite excesivo recortado o rechazado
- **WHEN** se invoca `list_tasks` con limit 500 con token válido
- **THEN** el sistema aplica el tope de 100 o devuelve error de validación en español

#### Listado no expone tareas de otros usuarios
- **WHEN** se invoca `list_tasks` con token válido de un usuario
- **THEN** solo se devuelven tareas asociadas al `userId` de ese usuario

### Requirement: Tools get/create/update/delete con aislamiento y autenticación
El sistema SHALL proveer `get_task`, `create_task`, `update_task` (parcial: titulo/descripcion/estado) y `delete_task` con la misma validación y reglas de fechaCulminada que la UI, resueltas al `userId` del token de autenticación y aisladas por usuario. En `create_task`, si `descripcion` se omite, el sistema SHALL persistir `null` sin inferir ni duplicar `titulo`; solo envía `descripcion` cuando el usuario la da explícitamente o pide duplicar.

#### Crear vía MCP visible en UI del mismo usuario
- **WHEN** un agente invoca `create_task` con título válido y token válido
- **THEN** la tarea queda persistida asociada al `userId` del token y aparece en el listado web de ese usuario

#### Crear solo con título no inventa descripción
- **WHEN** un agente invoca `create_task` solo con `titulo` y token válido
- **THEN** la tarea queda con `descripcion` nula y `get_task` la devuelve como nula

#### Crear con descripción explícita la conserva
- **WHEN** un agente invoca `create_task` con `titulo` y `descripcion` explícita y token válido
- **THEN** ambas quedan persistidas tal cual

#### Actualizar estado vía MCP
- **WHEN** un agente invoca `update_task` con estado COMPLETADA y token válido
- **THEN** fechaCulminada se asigna y la UI muestra la tarea como completada para ese usuario

#### Recurso inexistente
- **WHEN** se invoca `get_task`, `update_task` o `delete_task` con id desconocido y token válido
- **THEN** responde error controlado indicando que la tarea no existe

#### Acceso a tarea de otro usuario rechazado
- **WHEN** un agente invoca `get_task`, `update_task` o `delete_task` con id de una tarea asociada a otro `userId`
- **THEN** el sistema rechaza la operación con error de autorización

### Requirement: Formato y validación de respuestas MCP
Todas las tools SHALL validar parámetros con Zod (mensajes en español) y responder `{ content: [{ type: 'text', text: '<JSON>' }] }`; los errores de validación se devuelven como texto de error controlado, no como excepción sin formato. La validación y sus mensajes SHALL vivir en `lib/validators.ts`: los esquemas que publica `tools/list` describen tipos y dejan los límites en su descripción, sin repetir las reglas de negocio con textos en otro idioma.

#### Scenario: Parámetro inválido
- **WHEN** se invoca `create_task` con título vacío y token válido
- **THEN** la respuesta es un error en español sin crear la tarea

#### Scenario: Título por encima del máximo
- **WHEN** se invoca `create_task` con un título de 101 caracteres y token válido
- **THEN** la respuesta en español indica el máximo de 100 caracteres y no se crea la tarea

#### Scenario: Error de autenticación
- **WHEN** se invoca cualquier tool MCP sin token válido
- **THEN** la respuesta es un error de autenticación en español

### Requirement: Consistencia de estado UI-MCP
Toda mutación por MCP SHALL ser visible de inmediato en la UI (misma base de datos) y viceversa, sin stores duplicados, dentro del ámbito del usuario autenticado.

#### Ida y vuelta
- **WHEN** la UI crea una tarea y el agente la completa vía MCP con token del mismo usuario
- **THEN** la UI muestra la tarea completada tras refrescar y `get_task` devuelve COMPLETADA con fechaCulminada
