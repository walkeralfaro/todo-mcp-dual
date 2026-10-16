# Spec Delta

## Purpose

Permite a usuarios web gestionar tareas (crear, listar, filtrar, editar y eliminar) con un estado único persistente y validado.

## ADDED Requirements

### Requirement: Modelo Task persistente
El sistema SHALL persistir cada tarea con id único, titulo obligatorio, descripcion opcional, estado PENDIENTE/EN_PROCESO/COMPLETADA, fechaCreacion por defecto y fechaCulminada opcional.

#### Scenario: Creación persiste todos los campos
- **WHEN** se crea una tarea con título y descripción
- **THEN** queda guardada con estado PENDIENTE, fechaCreacion asignada y fechaCulminada nula

#### Scenario: Estado por defecto
- **WHEN** se crea una tarea sin indicar estado
- **THEN** el sistema asigna PENDIENTE

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

### Requirement: Listado con filtros, búsqueda y orden
El sistema SHALL listar tareas ordenadas por fechaCreacion descendente, con filtro por estado (TODAS/PENDIENTE/EN_PROCESO/COMPLETADA) y búsqueda por texto en título/descripción.

#### Scenario: Filtrar por estado
- **WHEN** el usuario filtra por EN_PROCESO
- **THEN** solo se muestran tareas en ese estado ordenadas de más reciente a más antigua

#### Scenario: Buscar por texto
- **WHEN** el usuario busca "informe"
- **THEN** se muestran tareas cuyo título o descripción contienen "informe" sin distinguir mayúsculas

### Requirement: CRUD completo desde la UI
El sistema SHALL permitir desde la interfaz crear, editar título/descripción, cambiar estado y eliminar tareas con confirmación, reflejando cada cambio de inmediato en el listado.

#### Scenario: Editar y cambiar estado
- **WHEN** el usuario edita el título y mueve la tarea a COMPLETADA
- **THEN** el listado muestra los nuevos datos y la tarea aparece como completada

#### Scenario: Eliminar con confirmación
- **WHEN** el usuario confirma el borrado
- **THEN** la tarea desaparece del listado y ya no es recuperable por listado ni detalle
