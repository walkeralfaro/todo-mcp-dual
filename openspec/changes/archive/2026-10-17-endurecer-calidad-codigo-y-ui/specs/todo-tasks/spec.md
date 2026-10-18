# Spec Delta

## MODIFIED Requirements

### Requirement: Titular del día con cifra de pendientes
El sistema SHALL mostrar como único titular destacado el repaso del día con la cifra de tareas no completadas del usuario autenticado (p. ej. "Hoy quedan 3") a tamaño héroe (5–7vw), recalculada al completar o crear tareas, con la cifra en neón y un pulso visible al descontar sin recarga manual. La cifra SHALL contar todas las tareas no completadas del usuario, con independencia del filtro de estado activo, de la búsqueda activa y del máximo de filas que muestre el listado.

#### Cifra visible al cargar
- **WHEN** el usuario abre la página con 3 tareas PENDIENTE o EN_PROCESO asociadas a su `userId`
- **THEN** el titular muestra la cifra 3 junto al texto del día

#### Cifra recalcula al completar
- **WHEN** el usuario mueve una tarea a COMPLETADA
- **THEN** el titular decrementa su cifra sin recarga manual

#### Pulso neón al descontar
- **WHEN** el usuario completa una tarea y la cifra del titular cambia
- **THEN** la cifra emite un pulso breve (solo `opacity`/`transform`, ≤300ms) en neón y queda legible en su valor final

#### Scenario: Cifra independiente del filtro y la búsqueda
- **WHEN** el usuario tiene 3 tareas no completadas y activa el filtro COMPLETADA, o busca un texto que solo coincide con tareas completadas
- **THEN** el titular sigue mostrando la cifra 3, mientras el listado queda vacío o solo con las coincidencias

#### Scenario: Cifra no limitada por la ventana del listado
- **WHEN** el usuario tiene más tareas no completadas que el máximo de filas que muestra el listado
- **THEN** el titular muestra el total real de no completadas y no el número de filas visibles
