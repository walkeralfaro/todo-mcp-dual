# todo-tasks Specification

## Purpose

Define el modelo de tarea, sus reglas de validación y de ciclo de vida, y la
semántica de listado, filtrado y aislamiento por usuario que comparten la
interfaz web y el servidor MCP.

## Requirements

### Requirement: Modelo Task persistente
El sistema SHALL persistir cada tarea con id único, titulo obligatorio, descripcion opcional, estado PENDIENTE/EN_PROCESO/COMPLETADA, fechaCreacion por defecto y fechaCulminada opcional, asociada a un usuario autenticado mediante `userId`. Si al crear no llega `descripcion` explícita, el sistema SHALL guardar `null` sin copiar `titulo`.

#### Scenario: Creación persiste todos los campos
- **WHEN** se crea una tarea con título y descripción como usuario autenticado
- **THEN** queda guardada con estado PENDIENTE, fechaCreacion asignada, fechaCulminada nula y asociada al `userId` del usuario

#### Scenario: Creación solo con título deja descripción nula
- **WHEN** se crea una tarea solo con `titulo` como usuario autenticado
- **THEN** queda guardada con `descripcion` nula, estado PENDIENTE, fechaCulminada nula y asociada al `userId` del usuario

#### Scenario: Estado por defecto
- **WHEN** se crea una tarea sin indicar estado como usuario autenticado
- **THEN** el sistema asigna PENDIENTE

#### Scenario: Tarea requiere usuario autenticado
- **WHEN** se intenta crear una tarea sin sesión de usuario autenticada
- **THEN** la operación falla con error de autenticación

### Requirement: Ciclo de vida de fechaCulminada
El sistema SHALL asignar fechaCulminada al entrar en COMPLETADA y limpiarla (null) al salir hacia PENDIENTE o EN_PROCESO; las transiciones entre los tres estados son libres.

#### Scenario: Completar asigna fecha
- **WHEN** una tarea pasa a COMPLETADA
- **THEN** fechaCulminada queda con la fecha-hora actual

#### Scenario: Reabrir limpia fecha
- **WHEN** una tarea COMPLETADA pasa a PENDIENTE o EN_PROCESO
- **THEN** fechaCulminada vuelve a null

### Requirement: Validación de entrada en español
El sistema SHALL rechazar títulos vacíos o de más de 100 caracteres y descripciones de más de 500 caracteres, devolviendo mensajes de error en español.

#### Scenario: Título vacío rechazado
- **WHEN** se intenta crear una tarea con título vacío
- **THEN** la operación falla con mensaje "El título es obligatorio"

#### Scenario: Límites de longitud
- **WHEN** se envía título de 101 caracteres o descripción de 501
- **THEN** la operación falla con mensaje de máximo excedido

### Requirement: Aislamiento de tareas por usuario
El sistema SHALL asociar cada tarea al usuario autenticado que la creó y asegurar que un usuario solo pueda acceder a sus propias tareas, tanto desde la interfaz web como desde el servidor MCP.

#### Scenario: Tarea pertenece al usuario creador
- **WHEN** un usuario autenticado crea una tarea
- **THEN** la tarea queda asociada al `userId` de ese usuario

#### Scenario: Usuario no ve tareas de otros usuarios
- **WHEN** un usuario autenticado lista sus tareas
- **THEN** solo se muestran las tareas asociadas a su `userId`, nunca tareas de otros usuarios

#### Scenario: Acceso a tarea ajena rechazado
- **WHEN** un usuario intenta leer, editar o eliminar una tarea asociada a otro `userId`
- **THEN** el sistema rechaza la operación con error de autorización

### Requirement: Listado filtrado y ordenado por usuario
El sistema SHALL listar las tareas del usuario autenticado ordenadas por fechaCreacion descendente, con filtro por estado (TODAS/PENDIENTE/EN_PROCESO/COMPLETADA) y búsqueda por texto en título o descripción, aplicando siempre el `userId` del usuario autenticado.

#### Scenario: Listar tareas filtra por usuario
- **WHEN** un usuario autenticado lista sus tareas
- **THEN** solo se muestran tareas asociadas a su `userId`, ordenadas de más reciente a más antigua

#### Scenario: Filtrar por estado
- **WHEN** el usuario filtra por EN_PROCESO
- **THEN** solo se muestran tareas en ese estado ordenadas de más reciente a más antigua

#### Scenario: Buscar por texto
- **WHEN** el usuario busca "informe"
- **THEN** se muestran tareas cuyo título o descripción contienen "informe" sin distinguir mayúsculas
