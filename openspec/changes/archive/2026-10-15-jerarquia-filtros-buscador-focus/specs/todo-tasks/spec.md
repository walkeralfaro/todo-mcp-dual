# Spec Delta

## MODIFIED Requirements

### Requirement: Listado con filtros, búsqueda y orden
El sistema SHALL listar tareas ordenadas por fechaCreacion descendente, con filtro por estado (TODAS/PENDIENTE/EN_PROCESO/COMPLETADA) y búsqueda por texto en título/descripción. El filtro de estado SHALL presentarse como control segmentado con una sola opción activa (pastilla elevada distinguible, navegable por teclado) y la búsqueda SHALL presentarse como campo elevado distinguible de filtros y tareas, aplicar debounce (~300 ms), ofrecer botón para limpiar y anunciar el número de resultados con `aria-live="polite"`. El foco del buscador SHALL dibujarse íntegramente dentro de su caja (sin recortes por contenedores con scroll) y seguir siendo visible a teclado.

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

#### Scenario: Jerarquía buscador, filtros y tareas
- **WHEN** el usuario visualiza la zona de filtros con tareas cargadas
- **THEN** el buscador se distingue como campo elevado, el filtro activo como pastilla seleccionada y las tareas como filas de contenido, sin que los tres compartan el mismo tratamiento plano

#### Scenario: Foco del buscador sin recortes
- **WHEN** el usuario enfoca el buscador con teclado en desktop y en móvil (390px)
- **THEN** el indicador de foco se muestra completo (izquierda, derecha, arriba y abajo) sin cortes por scroll ni contenedores, con contraste visible sobre la superficie del campo

### Requirement: Sistema sobrio de tipo y color con acento único
La UI SHALL usar fondo rosado grisáceo con tinta marrón-negra, Stack Sans (display light + texto regular/medium), cuerpo a 17–19px en tinta plena, y reservar el verde exclusivamente al botón primario y al estado COMPLETADA. El formulario y los filtros SHALL aplicar jerarquía (título de sección 18–20px semibold con `text-balance`, etiquetas 14px medium, ayuda/error 13–14px), foco visible de 2px con offset en todo control interactivo (anillo interior no recortable en el buscador) y contraste AA en texto, muted y foco, incluido el texto secundario sobre superficies elevadas.

#### Scenario: Acento único
- **WHEN** se inspecciona la página con tareas en varios estados
- **THEN** el verde aparece solo en la acción primaria y en la marca de COMPLETADA, nunca en filtros ni textos secundarios

#### Scenario: Contraste de texto
- **WHEN** se mide el contraste del cuerpo y del verde sobre el fondo
- **THEN** el texto de cuerpo cumple AA y el verde cumple AA para texto o se usa solo en elementos grandes/no textuales

#### Scenario: Jerarquía y foco visibles
- **WHEN** se inspeccionan el formulario de creación y los filtros
- **THEN** el título de sección es el texto de mayor peso/tamaño, las etiquetas son secundarias y cada control muestra anillo de foco de 2px al navegar por teclado sin usar `outline-none` sin reemplazo

#### Scenario: Contraste sobre superficies elevadas
- **WHEN** se mide el texto secundario sobre la card del formulario
- **THEN** el ratio cumple AA (≥4.5:1) aunque el fondo de la card difiera del fondo de página
