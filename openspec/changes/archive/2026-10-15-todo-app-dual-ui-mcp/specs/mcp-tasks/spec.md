# Spec Delta

## Purpose

Expone las tareas a agentes IA externos mediante un servidor MCP con 5 herramientas CRUD validadas sobre la misma base de datos que la UI.

## ADDED Requirements

### Requirement: Endpoint MCP Streamable HTTP sin auth v1
El sistema SHALL exponer el servidor MCP en la ruta `/api/mcp` mediante Streamable HTTP, accesible sin autenticación en v1.

#### Scenario: Descubrimiento de herramientas
- **WHEN** un cliente MCP inicia sesión contra `/api/mcp`
- **THEN** descubre las 5 herramientas de tareas sin necesidad de token

### Requirement: Tool list_tasks con guardrails
La tool `list_tasks` SHALL aceptar `estado`, `q`, `limit` (default 50, max 100) y `offset` (default 0), devolviendo tareas en JSON dentro de `content[0].text` ordenadas por fechaCreacion desc.

#### Scenario: Listado por defecto limitado
- **WHEN** se invoca `list_tasks` sin parámetros
- **THEN** devuelve hasta 50 tareas ordenadas de más reciente a más antigua

#### Scenario: Límite excesivo recortado o rechazado
- **WHEN** se invoca `list_tasks` con limit 500
- **THEN** el sistema aplica el tope de 100 o devuelve error de validación en español

### Requirement: Tools get/create/update/delete
El sistema SHALL proveer `get_task`, `create_task`, `update_task` (parcial: titulo/descripcion/estado) y `delete_task` con la misma validación y reglas de fechaCulminada que la UI.

#### Scenario: Crear vía MCP visible en UI
- **WHEN** un agente invoca `create_task` con título válido
- **THEN** la tarea queda persistida y aparece en el listado web

#### Scenario: Actualizar estado vía MCP
- **WHEN** un agente invoca `update_task` con estado COMPLETADA
- **THEN** fechaCulminada se asigna y la UI muestra la tarea como completada

#### Scenario: Recurso inexistente
- **WHEN** se invoca `get_task`, `update_task` o `delete_task` con id desconocido
- **THEN** responde error controlado indicando que la tarea no existe

### Requirement: Formato y validación de respuestas MCP
Todas las tools SHALL validar parámetros con Zod (mensajes en español) y responder `{ content: [{ type: 'text', text: '<JSON>' }] }`; los errores de validación se devuelven como texto de error controlado, no como excepción sin formato.

#### Scenario: Parámetro inválido
- **WHEN** se invoca `create_task` con título vacío
- **THEN** la respuesta es un error en español sin crear la tarea

### Requirement: Consistencia de estado UI-MCP
Toda mutación por MCP SHALL ser visible de inmediato en la UI (misma base de datos) y viceversa, sin stores duplicados.

#### Scenario: Ida y vuelta
- **WHEN** la UI crea una tarea y el agente la completa vía MCP
- **THEN** la UI muestra la tarea completada tras refrescar y `get_task` devuelve COMPLETADA con fechaCulminada
