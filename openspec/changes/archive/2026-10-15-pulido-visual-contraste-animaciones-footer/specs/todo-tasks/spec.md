# Spec Delta

## ADDED Requirements

### Requirement: Superficies elevadas distinguibles del fondo
La card del formulario de creación y el menú del desplegable de estado SHALL distinguirse del fondo mediante superficie elevada (fondo más claro que `ground`, borde sutil y sombra), de modo que no se confundan con el fondo de página. El texto `muted` sobre superficies SHALL cumplir contraste AA (≥4.5:1).

#### Scenario: Card distinguible del fondo
- **WHEN** el usuario visualiza el formulario de creación junto al fondo de página
- **THEN** la card presenta borde y elevación propios y su perímetro es identificable sin depender solo del tono

#### Scenario: Muted legible sobre superficies
- **WHEN** se mide el contraste del texto secundario sobre la card y sobre el menú desplegable
- **THEN** el ratio es ≥4.5:1 en ambos casos

### Requirement: Transiciones suaves con reduced-motion
El diálogo de confirmación y el desplegable de estado SHALL abrirse y cerrarse con transición visible (fundido + escala desde 0.95, ≤300ms, `ease-out` al entrar), y los botones y filas SHALL responder al hover/active solo con cambios de `transform`/`opacity`. Con `prefers-reduced-motion` el sistema SHALL suprimir el movimiento (fundido breve o sin animación) manteniendo el contenido y el foco.

#### Scenario: Diálogo entra con transición
- **WHEN** el usuario activa Eliminar en una tarea
- **THEN** el diálogo aparece con fundido y escala progresivos en lugar de mostrarse de golpe

#### Scenario: Movimiento reducido respetado
- **WHEN** el usuario opera con `prefers-reduced-motion` activado
- **THEN** abrir el diálogo o el desplegable no produce desplazamiento, escala ni zoom perceptibles y el foco sigue gestionado

### Requirement: Footer al borde inferior sin sticky
El footer SHALL situarse al borde inferior de la página mediante layout (flujo normal con empuje al final), sin usar `position: sticky` ni `position: fixed`, y SHALL NOT cubrir contenido ni el elemento con foco. En móvil queda al final del documento tras la lista.

#### Scenario: Footer abajo con pocas tareas
- **WHEN** el usuario abre la página en desktop con cero o una tarea
- **THEN** el footer se ubica en el borde inferior del viewport sin superponerse a la lista ni seguir al scroll como sticky

#### Scenario: Footer no tapa el foco
- **WHEN** el usuario navega por teclado hasta el último control antes del footer
- **THEN** el elemento enfocado queda totalmente visible y el footer no lo cubre

## MODIFIED Requirements

### Requirement: Sistema sobrio de tipo y color con acento único
La UI SHALL usar fondo rosado grisáceo con tinta marrón-negra, Stack Sans (display light + texto regular/medium), cuerpo a 17–19px en tinta plena, y reservar el verde exclusivamente al botón primario y al estado COMPLETADA. El formulario y los filtros SHALL aplicar jerarquía (título de sección 18–20px semibold con `text-balance`, etiquetas 14px medium, ayuda/error 13–14px), foco visible `focus-visible:ring` de 2px con offset en todo control interactivo y contraste AA en texto, muted y foco, incluido el texto secundario sobre superficies elevadas.

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
