# Spec Delta

## MODIFIED Requirements

### Requirement: Sistema sobrio de tipo y color con acento único
La UI SHALL usar tema oscuro "turno de noche" (fondo noche profunda, superficies por escalones de tono, sin degradados), Albert Sans (display semibold + texto regular/medium), cuerpo a 17–19px en tinta plena, y reservar el neón menta exclusivamente a la cifra viva del día, al botón primario y al estado COMPLETADA. El formulario y los filtros SHALL aplicar jerarquía (título de sección 18–20px semibold con `text-balance`, etiquetas 14px medium, ayuda/error 13–14px), foco visible de 2px con offset en todo control interactivo (anillo interior no recortable en el buscador) y contraste AA en texto, muted y foco sobre cada superficie oscura.

#### Scenario: Acento único
- **WHEN** se inspecciona la página con tareas en varios estados
- **THEN** el neón aparece solo en la cifra del día, la acción primaria y la marca de COMPLETADA, nunca en filtros ni textos secundarios

#### Scenario: Contraste de texto
- **WHEN** se mide el contraste del cuerpo y del neón sobre el fondo oscuro
- **THEN** el texto de cuerpo cumple AA y el neón cumple AA para texto o se usa solo en elementos grandes/no textuales

#### Scenario: Jerarquía y foco visibles
- **WHEN** se inspeccionan el formulario de creación y los filtros
- **THEN** el título de sección es el texto de mayor peso/tamaño, las etiquetas son secundarias y cada control muestra anillo de foco de 2px al navegar por teclado sin usar `outline-none` sin reemplazo

#### Scenario: Contraste sobre superficies elevadas
- **WHEN** se mide el texto secundario sobre la card del formulario en tema oscuro
- **THEN** el ratio cumple AA (≥4.5:1) aunque el fondo de la card difiera del fondo de página

### Requirement: Titular del día con cifra de pendientes
El sistema SHALL mostrar como único titular destacado el repaso del día con la cifra de tareas no completadas (p. ej. "Hoy quedan 3") a tamaño héroe (5–7vw), recalculada al completar o crear tareas, con la cifra en neón y un pulso visible al descontar sin recarga manual.

#### Scenario: Cifra visible al cargar
- **WHEN** el usuario abre la página con 3 tareas PENDIENTE o EN_PROCESO
- **THEN** el titular muestra la cifra 3 junto al texto del día

#### Scenario: Cifra recalcula al completar
- **WHEN** el usuario mueve una tarea a COMPLETADA
- **THEN** el titular decrementa su cifra sin recarga manual

#### Scenario: Pulso neón al descontar
- **WHEN** el usuario completa una tarea y la cifra del titular cambia
- **THEN** la cifra emite un pulso breve (solo `opacity`/`transform`, ≤300ms) en neón y queda legible en su valor final
