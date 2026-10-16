# Spec Delta

## ADDED Requirements

### Requirement: Titular del día con cifra de pendientes
El sistema SHALL mostrar como único titular destacado el repaso del día con la cifra de tareas no completadas (p. ej. "Hoy quedan 3"), recalculada al completar o crear tareas.

#### Scenario: Cifra visible al cargar
- **WHEN** el usuario abre la página con 3 tareas PENDIENTE o EN_PROCESO
- **THEN** el titular muestra la cifra 3 junto al texto del día

#### Scenario: Cifra recalcula al completar
- **WHEN** el usuario mueve una tarea a COMPLETADA
- **THEN** el titular decrementa su cifra sin recarga manual

### Requirement: Filas de dos extremos sin cajas
Cada tarea del listado SHALL presentarse como fila sin tarjeta ni separadores: título en tinta plena a la izquierda y estado/fecha a tamaño secundario a la derecha; los grupos de estado se separan solo con espacio.

#### Scenario: Fila muestra título y estado
- **WHEN** el listado contiene una tarea PENDIENTE con descripción
- **THEN** la fila muestra título, descripción y el estado alineado al extremo derecho sin bordes de tarjeta

#### Scenario: Grupos separados por espacio
- **WHEN** hay tareas en varios estados con el filtro TODAS
- **THEN** cada grupo empieza con su palabra de estado y espacio, sin líneas divisorias

### Requirement: Sistema sobrio de tipo y color con acento único
La UI SHALL usar fondo rosado grisáceo con tinta marrón-negra, Stack Sans (display light + texto regular/medium), cuerpo a 17–19px en tinta plena, y reservar el verde exclusivamente al botón primario y al estado COMPLETADA.

#### Scenario: Acento único
- **WHEN** se inspecciona la página con tareas en varios estados
- **THEN** el verde aparece solo en la acción primaria y en la marca de COMPLETADA, nunca en filtros ni textos secundarios

#### Scenario: Contraste de texto
- **WHEN** se mide el contraste del cuerpo y del verde sobre el fondo
- **THEN** el texto de cuerpo cumple AA y el verde cumple AA para texto o se usa solo en elementos grandes/no textuales

### Requirement: Flujos y selectores de test estables
El rediseño SHALL conservar todos los flujos (crear, filtrar, buscar, editar, cambiar estado, eliminar con confirmación) y todos los `data-testid` existentes, de modo que el E2E actual pasa sin modificaciones.

#### Scenario: E2E sin cambios
- **WHEN** se ejecuta `npx playwright test` con el spec `e2e/todo.spec.ts` actual
- **THEN** el flujo completo (crear, filtrar, editar, completar, borrar) termina en verde
