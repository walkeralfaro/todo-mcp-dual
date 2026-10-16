# Spec Delta

## ADDED Requirements

### Requirement: Layout desktop a altura de viewport con tareas prioritarias
El sistema SHALL presentar en desktop (≥1024px) la app a la altura del viewport (`100dvh`) con la lista de tareas como región principal con scroll propio, manteniendo visibles el titular, el formulario de creación y los filtros sin desplazar las tareas fuera de pantalla. Las tareas SHALL ubicarse en la zona de mayor jerarquía visual (columna principal o primera sección visible) y nunca debajo de un formulario de altura completa. En móvil (<1024px) el apilado vertical se conserva con formulario compacto.

#### Scenario: Altura de viewport en desktop
- **WHEN** el usuario abre la app en un viewport desktop de 1440×900
- **THEN** el contenedor raíz mide la altura del viewport sin scroll de página global y solo la región de la lista hace scroll interno

#### Scenario: Tareas visibles sin scroll inicial
- **WHEN** existen al menos 3 tareas y el usuario carga la página en desktop
- **THEN** la primera tarea es visible sin desplazar la página y el formulario no ocupa más del 40% de la altura visible

#### Scenario: Móvil conserva apilado compacto
- **WHEN** el usuario abre la app en un viewport de 390px de ancho
- **THEN** titular, formulario compacto, filtros y lista aparecen apilados y toda la página hace scroll como un único documento

### Requirement: Desplegables y diálogos shadcn sin alerts nativos
El sistema SHALL implementar todo desplegable de la UI (incluido el cambio de estado por tarea) con el componente shadcn `Select` (Radix) accesible por teclado, y toda confirmación o mensaje modal (incluido el borrado) con `Dialog` o `AlertDialog` shadcn con foco gestionado, cierre por Escape y botones explícitos. El sistema SHALL NOT usar `window.alert`, `window.confirm` ni `window.prompt` en ningún flujo. Cada control shadcn SHALL conservar el `data-testid` existente y el anillo de foco visible de 2px.

#### Scenario: Cambio de estado con Select shadcn
- **WHEN** el usuario abre el desplegable de estado de una tarea por teclado y elige EN_PROCESO
- **THEN** el menú se abre/cierra con Enter/Escape, la opción queda seleccionada, el cambio persiste y el control conserva `data-testid="status-select"`

#### Scenario: Borrado con diálogo shadcn
- **WHEN** el usuario activa Eliminar en una tarea
- **THEN** se abre un diálogo con título, descripción y botones Cancelar/Eliminar, el foco entra al diálogo, Escape o Cancelar lo cierra sin borrar, y Confirmar elimina la tarea

#### Scenario: Ausencia de alerts nativos
- **WHEN** se ejecuta la suite E2E con diálogos nativos auto-descartados o espiando `window.confirm`
- **THEN** ningún flujo invoca `window.alert` ni `window.confirm` y todos los borrados pasan por el diálogo shadcn

## MODIFIED Requirements

### Requirement: CRUD completo desde la UI
El sistema SHALL permitir desde la interfaz crear, editar título/descripción, cambiar estado mediante desplegable shadcn y eliminar tareas con diálogo de confirmación shadcn, reflejando cada cambio de inmediato en el listado. El formulario de creación SHALL exponer etiqueta visible por campo, asociar errores con `aria-describedby` + `aria-invalid`, anunciarlos con `role="alert"`, mantener `data-testid` existentes y mostrar estado pendiente con indicador accesible sin deshabilitar el envío antes de iniciar la petición.

#### Scenario: Editar y cambiar estado
- **WHEN** el usuario edita el título y mueve la tarea a COMPLETADA desde el desplegable shadcn
- **THEN** el listado muestra los nuevos datos y la tarea aparece como completada

#### Scenario: Eliminar con confirmación
- **WHEN** el usuario confirma el borrado en el diálogo shadcn
- **THEN** la tarea desaparece del listado y ya no es recuperable por listado ni detalle

#### Scenario: Etiquetas y error anunciado al crear
- **WHEN** el usuario intenta crear una tarea con título vacío
- **THEN** el campo título queda marcado `aria-invalid="true"`, el mensaje en español aparece junto al campo con `role="alert"` y el foco se mueve al primer campo con error

#### Scenario: Estado pendiente accesible
- **WHEN** el usuario envía el formulario de creación
- **THEN** el botón muestra indicador de carga con texto "Creando…" y `aria-busy`, permanece deshabilitado solo durante la petición y conserva `data-testid="create-btn"`

#### Scenario: Cancelar borrado no elimina
- **WHEN** el usuario abre el diálogo de borrado y activa Cancelar o pulsa Escape
- **THEN** el diálogo se cierra, el foco vuelve al botón Eliminar que lo abrió y la tarea sigue en el listado
