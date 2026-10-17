# Spec Delta

## Purpose

Gestiona el ciclo de vida de los tokens de acceso MCP de cada usuario: generación con visualización única, listado identificable, revocación inmediata e instrucciones de conexión, integrados con la autenticación Bearer existente del servidor MCP.

## ADDED Requirements

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
