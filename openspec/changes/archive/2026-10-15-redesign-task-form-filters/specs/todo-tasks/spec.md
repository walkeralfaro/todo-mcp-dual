# Spec Delta

## MODIFIED Requirements

### Requirement: Listado con filtros, búsqueda y orden
El sistema SHALL listar tareas ordenadas por fechaCreacion descendente, con filtro por estado (TODAS/PENDIENTE/EN_PROCESO/COMPLETADA) y búsqueda por texto en título/descripción. El filtro de estado SHALL comportarse como selección única accesible (un solo valor activo, navegable por teclado) y la búsqueda SHALL aplicar debounce (~300 ms), ofrecer botón para limpiar y anunciar el número de resultados con `aria-live="polite"`.

#### Scenario: Filtrar por estado
- **WHEN** el usuario filtra por EN_PROCESO
- **THEN** solo se muestran tareas en ese estado ordenadas de más reciente a más antigua

#### Scenario: Buscar por texto
- **WHEN** el usuario busca "informe"
- **THEN** se muestran tareas cuyo título o descripción contienen "informe" sin distinguir mayúsculas

#### Scenario: Filtro como selección única accesible
- **WHEN** el usuario navega los filtros por teclado y elige PENDIENTE
- **THEN** solo PENDIENTE queda activo, el foco es visible y el estado se refleja en la URL (`?estado=PENDIENTE`)

#### Scenario: Búsqueda con debounce y anuncio
- **WHEN** el usuario escribe "inf" rápido en el buscador
- **THEN** el sistema espera ~300 ms tras la última tecla antes de filtrar y anuncia "N tareas encontradas" vía `aria-live`

#### Scenario: Limpiar búsqueda
- **WHEN** el usuario activa el botón limpiar del buscador
- **THEN** el campo se vacía, el parámetro `q` se elimina de la URL y el foco vuelve al campo de búsqueda

### Requirement: CRUD completo desde la UI
El sistema SHALL permitir desde la interfaz crear, editar título/descripción, cambiar estado y eliminar tareas con confirmación, reflejando cada cambio de inmediato en el listado. El formulario de creación SHALL exponer etiqueta visible por campo, asociar errores con `aria-describedby` + `aria-invalid`, anunciarlos con `role="alert"`, mantener `data-testid` existentes y mostrar estado pendiente con indicador accesible sin deshabilitar el envío antes de iniciar la petición.

#### Scenario: Editar y cambiar estado
- **WHEN** el usuario edita el título y mueve la tarea a COMPLETADA
- **THEN** el listado muestra los nuevos datos y la tarea aparece como completada

#### Scenario: Eliminar con confirmación
- **WHEN** el usuario confirma el borrado
- **THEN** la tarea desaparece del listado y ya no es recuperable por listado ni detalle

#### Scenario: Etiquetas y error anunciado al crear
- **WHEN** el usuario intenta crear una tarea con título vacío
- **THEN** el campo título queda marcado `aria-invalid="true"`, el mensaje en español aparece junto al campo con `role="alert"` y el foco se mueve al primer campo con error

#### Scenario: Estado pendiente accesible
- **WHEN** el usuario envía el formulario de creación
- **THEN** el botón muestra indicador de carga con texto "Creando…" y `aria-busy`, permanece deshabilitado solo durante la petición y conserva `data-testid="create-btn"`

### Requirement: Sistema sobrio de tipo y color con acento único
La UI SHALL usar fondo rosado grisáceo con tinta marrón-negra, Stack Sans (display light + texto regular/medium), cuerpo a 17–19px en tinta plena, y reservar el verde exclusivamente al botón primario y al estado COMPLETADA. El formulario y los filtros SHALL aplicar jerarquía (título de sección 18–20px semibold con `text-balance`, etiquetas 14px medium, ayuda/error 13–14px), foco visible `focus-visible:ring` de 2px con offset en todo control interactivo y contraste AA en texto, muted y foco.

#### Scenario: Acento único
- **WHEN** se inspecciona la página con tareas en varios estados
- **THEN** el verde aparece solo en la acción primaria y en la marca de COMPLETADA, nunca en filtros ni textos secundarios

#### Scenario: Contraste de texto
- **WHEN** se mide el contraste del cuerpo y del verde sobre el fondo
- **THEN** el texto de cuerpo cumple AA y el verde cumple AA para texto o se usa solo en elementos grandes/no textuales

#### Scenario: Jerarquía y foco visibles
- **WHEN** se inspeccionan el formulario de creación y los filtros
- **THEN** el título de sección es el texto de mayor peso/tamaño, las etiquetas son secundarias y cada control muestra anillo de foco de 2px al navegar por teclado sin usar `outline-none` sin reemplazo
