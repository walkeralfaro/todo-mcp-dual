# mcp Specification

## Purpose

Expone las tareas a agentes IA externos mediante el servidor MCP en
`/api/mcp`, con cinco herramientas CRUD validadas sobre la misma base de datos
que la UI, y gestiona las credenciales (tokens) con las que esos agentes se
autentican.

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

#### Scenario: Listado por defecto limitado
- **WHEN** se invoca `list_tasks` sin parámetros con token válido
- **THEN** devuelve hasta 50 tareas del usuario autenticado ordenadas de más reciente a más antigua

#### Scenario: Límite excesivo recortado o rechazado
- **WHEN** se invoca `list_tasks` con limit 500 con token válido
- **THEN** el sistema aplica el tope de 100 o devuelve error de validación en español

#### Scenario: Listado no expone tareas de otros usuarios
- **WHEN** se invoca `list_tasks` con token válido de un usuario
- **THEN** solo se devuelven tareas asociadas al `userId` de ese usuario

### Requirement: Tools get/create/update/delete con aislamiento y autenticación
El sistema SHALL proveer `get_task`, `create_task`, `update_task` (parcial: titulo/descripcion/estado) y `delete_task` con la misma validación y reglas de fechaCulminada que la UI, resueltas al `userId` del token de autenticación y aisladas por usuario. En `create_task`, si `descripcion` se omite, el sistema SHALL persistir `null` sin inferir ni duplicar `titulo`; solo envía `descripcion` cuando el usuario la da explícitamente o pide duplicar.

#### Scenario: Crear vía MCP visible en UI del mismo usuario
- **WHEN** un agente invoca `create_task` con título válido y token válido
- **THEN** la tarea queda persistida asociada al `userId` del token y aparece en el listado web de ese usuario

#### Scenario: Crear solo con título no inventa descripción
- **WHEN** un agente invoca `create_task` solo con `titulo` y token válido
- **THEN** la tarea queda con `descripcion` nula y `get_task` la devuelve como nula

#### Scenario: Crear con descripción explícita la conserva
- **WHEN** un agente invoca `create_task` con `titulo` y `descripcion` explícita y token válido
- **THEN** ambas quedan persistidas tal cual

#### Scenario: Actualizar estado vía MCP
- **WHEN** un agente invoca `update_task` con estado COMPLETADA y token válido
- **THEN** fechaCulminada se asigna y la UI muestra la tarea como completada para ese usuario

#### Scenario: Recurso inexistente
- **WHEN** se invoca `get_task`, `update_task` o `delete_task` con id desconocido y token válido
- **THEN** responde error controlado indicando que la tarea no existe

#### Scenario: Acceso a tarea de otro usuario rechazado
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

#### Scenario: Ida y vuelta
- **WHEN** la UI crea una tarea y el agente la completa vía MCP con token del mismo usuario
- **THEN** la UI muestra la tarea completada tras refrescar y `get_task` devuelve COMPLETADA con fechaCulminada

### Requirement: Generación de token con visualización única
El sistema SHALL generar, para el usuario autenticado, un token de acceso MCP con al menos 256 bits de aleatoriedad y prefijo `tmcp_`, mostrando su valor en claro una única vez. El sistema SHALL persistir únicamente su hash SHA-256 y un prefijo visible (primeros 8 caracteres), SHALL NOT poder recuperar el valor en claro después, y SHALL asignarle una expiración por defecto de 90 días.

#### Scenario: Generar y copiar
- **WHEN** el usuario autenticado activa "Generar token" y confirma
- **THEN** el sistema muestra el token completo una sola vez, con opción de copiarlo y aviso de que no volverá a mostrarse

#### Scenario: El valor no se recupera
- **WHEN** el usuario cierra el diálogo de generación o recarga la página
- **THEN** el token en claro deja de estar disponible y solo se muestra su prefijo y metadatos

#### Scenario: Persistencia segura
- **WHEN** se inspecciona el registro almacenado del token generado
- **THEN** contiene el hash SHA-256 y el prefijo visible, nunca el valor en claro

#### Scenario: Expiración por defecto
- **WHEN** se genera un token sin fecha de expiración explícita
- **THEN** su expiración queda a 90 días desde su creación

### Requirement: Listado de tokens identificable y aislado
El sistema SHALL listar para el usuario autenticado únicamente sus propios tokens, mostrando prefijo visible, fecha de creación, último uso y expiración, sin exponer jamás el valor en claro ni tokens de otros usuarios.

#### Scenario: Listado propio
- **WHEN** el usuario autenticado abre `/mcp` con tokens generados
- **THEN** ve cada token con su prefijo (p. ej. `tmcp_ab12…`), fecha de creación, último uso y expiración

#### Scenario: Aislamiento entre usuarios
- **WHEN** un usuario autenticado abre `/mcp` y otro usuario tiene tokens
- **THEN** solo aparecen los tokens del usuario autenticado

#### Scenario: Sin valor en claro en la lista
- **WHEN** se inspecciona la página o el estado de la lista de tokens
- **THEN** ningún token aparece completo; solo prefijo y metadatos

### Requirement: Revocación inmediata por el propietario
El sistema SHALL permitir al propietario revocar (eliminar) un token con confirmación previa; a partir de ese momento el token revocado SHALL ser rechazado por el servidor MCP. Un usuario SHALL NOT poder revocar tokens de otro usuario.

#### Scenario: Revocar con confirmación
- **WHEN** el usuario propietario confirma la revocación de un token
- **THEN** el token desaparece de la lista y el sistema lo reporta como revocado

#### Scenario: Token revocado rechazado por MCP
- **WHEN** un cliente MCP usa un token revocado en `Authorization: Bearer`
- **THEN** `/api/mcp` responde error de autenticación (401) sin ejecutar ninguna tool

#### Scenario: Revocación de tercero rechazada
- **WHEN** un usuario intenta revocar un token que no le pertenece
- **THEN** el sistema rechaza la operación y el token sigue activo

### Requirement: Uso del token generado contra el servidor MCP
Un token generado desde la interfaz SHALL autenticar solicitudes en `/api/mcp` como los existentes, resolviendo al `userId` de su propietario, actualizando su último uso y respetando la expiración; las operaciones SHALL quedar aisladas al usuario propietario.

#### Scenario: Token de la UI autentica tools
- **WHEN** un cliente MCP llama a `/api/mcp` con un token generado desde `/mcp`
- **THEN** las tools operan sobre las tareas del usuario propietario igual que con la UI web

#### Scenario: Último uso actualizado
- **WHEN** el token se usa al menos una vez contra `/api/mcp`
- **THEN** el listado muestra su último uso actualizado

#### Scenario: Token expirado rechazado
- **WHEN** un cliente MCP usa un token cuya expiración ya pasó
- **THEN** `/api/mcp` responde error de autenticación (401) aunque el registro siga existiendo

### Requirement: Instrucciones de conexión para clientes MCP
La página `/mcp` SHALL mostrar, solo a usuarios autenticados, las instrucciones para conectar un cliente MCP: URL del endpoint (`/api/mcp`), formato de la cabecera `Authorization: Bearer <token>` y un bloque de configuración de cliente copiable.

#### Scenario: Instrucciones visibles con sesión
- **WHEN** el usuario autenticado abre `/mcp`
- **THEN** ve la URL del endpoint, el formato de la cabecera y el bloque de configuración de cliente

#### Scenario: Copiar configuración
- **WHEN** el usuario activa copiar en el bloque de configuración
- **THEN** el contenido queda en el portapapeles con confirmación visible

#### Scenario: Sin sesión no hay instrucciones
- **WHEN** un visitante sin sesión solicita `/mcp`
- **THEN** es redirigido a la landing con el modal de acceso abierto y no ve instrucciones ni tokens
