# Spec Delta

## MODIFIED Requirements

### Requirement: Modelo Task persistente
El sistema SHALL persistir cada tarea con id único, titulo obligatorio, descripcion opcional, estado PENDIENTE/EN_PROCESO/COMPLETADA, fechaCreacion por defecto y fechaCulminada opcional, asociada a un usuario autenticado mediante `userId`. Si al crear no llega `descripcion` explícita, el sistema SHALL guardar `null` sin copiar `titulo`.

#### Creación persiste todos los campos
- **WHEN** se crea una tarea con título y descripción como usuario autenticado
- **THEN** queda guardada con estado PENDIENTE, fechaCreacion asignada, fechaCulminada nula y asociada al `userId` del usuario

#### Creación solo con título deja descripción nula
- **WHEN** se crea una tarea solo con `titulo` como usuario autenticado
- **THEN** queda guardada con `descripcion` nula, estado PENDIENTE, fechaCulminada nula y asociada al `userId` del usuario

#### Estado por defecto
- **WHEN** se crea una tarea sin indicar estado como usuario autenticado
- **THEN** el sistema asigna PENDIENTE

#### Tarea requiere usuario autenticado
- **WHEN** se intenta crear una tarea sin sesión de usuario autenticada
- **THEN** la operación falla con error de autenticación

### Requirement: Listado con filtros, búsqueda y orden
El sistema SHALL listar tareas ordenadas por fechaCreacion descendente, con filtro por estado (TODAS/PENDIENTE/EN_PROCESO/COMPLETADA) y búsqueda por texto en título/descripción, siempre filtradas por el `userId` del usuario autenticado.

#### Listar tareas filtra por usuario
- **WHEN** un usuario autenticado lista sus tareas
- **THEN** solo se muestran tareas asociadas a su `userId`, ordenadas de más reciente a más antigua

#### Filtrar por estado
- **WHEN** el usuario filtra por EN_PROCESO
- **THEN** solo se muestran tareas en ese estado ordenadas de más reciente a más antigua

#### Buscar por texto
- **WHEN** el usuario busca "informe"
- **THEN** se muestran tareas cuyo título o descripción contienen "informe" sin distinguir mayúsculas

#### Filtro como selección única accesible
- **WHEN** el usuario navega los filtros por teclado y elige PENDIENTE
- **THEN** solo PENDIENTE queda activo, el foco es visible y el estado se refleja en la URL (`?estado=PENDIENTE`)

#### Búsqueda con debounce y anuncio
- **WHEN** el usuario escribe "inf" rápido en el buscador
- **THEN** el sistema espera ~300 ms tras la última tecla antes de filtrar y anuncia "N tareas encontradas" vía `aria-live`

#### Limpiar búsqueda
- **WHEN** el usuario activa el botón limpiar del buscador
- **THEN** el campo se vacía, el parámetro `q` se elimina de la URL y el foco vuelve al campo de búsqueda

#### Jerarquía buscador, filtros y tareas
- **WHEN** el usuario visualiza la zona de filtros con tareas cargadas
- **THEN** el buscador se distingue como campo elevado, el filtro activo como pastilla seleccionada y las tareas como filas de contenido, sin que los tres compartan el mismo tratamiento plano

#### Foco del buscador sin recortes
- **WHEN** el usuario enfoca el buscador con teclado en desktop y en móvil (390px)
- **THEN** el indicador de foco se muestra completo (izquierda, derecha, arriba y abajo) sin cortes por scroll ni contenedores, con contraste visible sobre la superficie del campo

### Requirement: CRUD completo desde la UI
El sistema SHALL permitir desde la interfaz crear, editar título/descripción, cambiar estado mediante desplegable shadcn y eliminar tareas con diálogo de confirmación shadcn, reflejando cada cambio de inmediato en el listado, todo dentro del ámbito de tareas del usuario autenticado.

#### Editar y cambiar estado
- **WHEN** el usuario edita el título y mueve la tarea a COMPLETADA desde el desplegable shadcn
- **THEN** el listado muestra los nuevos datos y la tarea aparece como completada

#### Eliminar con confirmación
- **WHEN** el usuario confirma el borrado en el diálogo shadcn
- **THEN** la tarea desaparece del listado y ya no es recuperable por listado ni detalle

#### Etiquetas y error anunciado al crear
- **WHEN** el usuario intenta crear una tarea con título vacío
- **THEN** el campo título queda marcado `aria-invalid="true"`, el mensaje en español aparece junto al campo con `role="alert"` y el foco se mueve al primer campo con error

#### Estado pendiente accesible
- **WHEN** el usuario envía el formulario de creación
- **THEN** el botón muestra indicador de carga con texto "Creando…" y `aria-busy`, permanece deshabilitado solo durante la petición y conserva `data-testid="create-btn"`

#### Cancelar borrado no elimina
- **WHEN** el usuario abre el diálogo de borrado y activa Cancelar o pulsa Escape
- **THEN** el diálogo se cierra, el foco vuelve al botón Eliminar que lo abrió y la tarea sigue en el listado

#### Acciones por tarea usan Button shadcn
- **WHEN** el usuario inspecciona Editar, Guardar y Eliminar en una tarjeta en desktop y en móvil (390px)
- **THEN** los tres comparten altura, radio, tipografía y anillo de foco del `Button` shadcn (solo cambia variante/color por intención), conservan `edit-btn`, `save-btn` y `delete-btn`, y son operables por teclado y táctil sin perder el foco visible

#### Usuario no puede editar tarea de otro usuario
- **WHEN** un usuario intenta editar o eliminar una tarea asociada a otro `userId`
- **THEN** el sistema rechaza la operación con error de autorización

### Requirement: Titular del día con cifra de pendientes
El sistema SHALL mostrar como único titular destacado el repaso del día con la cifra de tareas no completadas del usuario autenticado (p. ej. "Hoy quedan 3") a tamaño héroe (5–7vw), recalculada al completar o crear tareas, con la cifra en neón y un pulso visible al descontar sin recarga manual.

#### Cifra visible al cargar
- **WHEN** el usuario abre la página con 3 tareas PENDIENTE o EN_PROCESO asociadas a su `userId`
- **THEN** el titular muestra la cifra 3 junto al texto del día

#### Cifra recalcula al completar
- **WHEN** el usuario mueve una tarea a COMPLETADA
- **THEN** el titular decrementa su cifra sin recarga manual

#### Pulso neón al descontar
- **WHEN** el usuario completa una tarea y la cifra del titular cambia
- **THEN** la cifra emite un pulso breve (solo `opacity`/`transform`, ≤300ms) en neón y queda legible en su valor final
