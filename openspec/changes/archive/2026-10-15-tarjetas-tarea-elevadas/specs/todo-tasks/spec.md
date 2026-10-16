# Spec Delta

## MODIFIED Requirements

### Requirement: Filas de dos extremos sin cajas
Cada tarea del listado SHALL presentarse como tarjeta elevada (`bg-elevated` con borde sutil y radio) que contiene título en tinta plena, descripción opcional, estado/fecha a tamaño secundario y su bloque de acciones (desplegable de estado, Editar/Guardar, Eliminar). El título y la descripción SHALL tolerar texto largo sin romper el layout (`break-words`) y la fecha SHALL formatearse con `Intl.DateTimeFormat` en español.

#### Scenario: Fila muestra título y estado
- **WHEN** el listado contiene una tarea PENDIENTE con descripción
- **THEN** la tarjeta muestra título, descripción y el estado alineado al extremo derecho junto a sus acciones contenidas

#### Scenario: Tarjeta distinguible con y sin hover
- **WHEN** el usuario visualiza la lista sin interactuar
- **THEN** cada tarea ya se distingue del fondo por su superficie elevada, sin depender del hover

#### Scenario: Texto largo no rompe la tarjeta
- **WHEN** una tarea tiene un título o descripción con palabras muy largas
- **THEN** el texto se ajusta dentro de la tarjeta sin desbordar ni solapar el estado/fecha

#### Scenario: Grupos separados por espacio
- **WHEN** hay tareas en varios estados con el filtro TODAS
- **THEN** cada grupo empieza con su palabra de estado y espacio, sin líneas divisorias
