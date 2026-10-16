# Spec Delta

## MODIFIED Requirements

### Requirement: Tools get/create/update/delete
El sistema SHALL proveer `get_task`, `create_task`, `update_task` (parcial: titulo/descripcion/estado) y `delete_task` con la misma validación y reglas de fechaCulminada que la UI. En `create_task`, si `descripcion` se omite, el sistema SHALL persistir `null` sin inferir ni duplicar `titulo`; solo envía `descripcion` cuando el usuario la da explícitamente o pide duplicar.

#### Scenario: Crear vía MCP visible en UI
- **WHEN** un agente invoca `create_task` con título válido
- **THEN** la tarea queda persistida y aparece en el listado web

#### Scenario: Crear solo con título no inventa descripción
- **WHEN** un agente invoca `create_task` solo con `titulo`
- **THEN** la tarea queda con `descripcion` nula y `get_task` la devuelve como nula

#### Scenario: Crear con descripción explícita la conserva
- **WHEN** un agente invoca `create_task` con `titulo` y `descripcion` explícita
- **THEN** ambas quedan persistidas tal cual

#### Scenario: Actualizar estado vía MCP
- **WHEN** un agente invoca `update_task` con estado COMPLETADA
- **THEN** fechaCulminada se asigna y la UI muestra la tarea como completada

#### Scenario: Recurso inexistente
- **WHEN** se invoca `get_task`, `update_task` o `delete_task` con id desconocido
- **THEN** responde error controlado indicando que la tarea no existe
