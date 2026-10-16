# Spec Delta

## MODIFIED Requirements

### Requirement: Modelo Task persistente
El sistema SHALL persistir cada tarea con id único, titulo obligatorio, descripcion opcional, estado PENDIENTE/EN_PROCESO/COMPLETADA, fechaCreacion por defecto y fechaCulminada opcional. Si al crear no llega `descripcion` explícita, el sistema SHALL guardar `null` sin copiar `titulo`.

#### Scenario: Creación persiste todos los campos
- **WHEN** se crea una tarea con título y descripción
- **THEN** queda guardada con estado PENDIENTE, fechaCreacion asignada y fechaCulminada nula

#### Scenario: Creación solo con título deja descripción nula
- **WHEN** se crea una tarea solo con `titulo`
- **THEN** queda guardada con `descripcion` nula, estado PENDIENTE y fechaCulminada nula

#### Scenario: Estado por defecto
- **WHEN** se crea una tarea sin indicar estado
- **THEN** el sistema asigna PENDIENTE
