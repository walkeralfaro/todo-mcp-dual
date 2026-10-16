# Spec Delta

## MODIFIED Requirements

### Requirement: CRUD completo desde la UI
El sistema SHALL permitir desde la interfaz crear, editar título/descripción, cambiar estado mediante desplegable shadcn y eliminar tareas con diálogo de confirmación shadcn, reflejando cada cambio de inmediato en el listado. El formulario de creación SHALL exponer etiqueta visible por campo, asociar errores con `aria-describedby` + `aria-invalid`, anunciarlos con `role="alert"`, mantener `data-testid` existentes y mostrar estado pendiente con indicador accesible sin deshabilitar el envío antes de iniciar la petición. Todos los botones de acción por tarea (Editar, Guardar, Eliminar) y del diálogo (Cancelar, Confirmar) SHALL implementarse con el componente shadcn `Button` con variante y tamaño coherentes, preservando `data-testid`, foco visible de 2px y estados `disabled`/`aria-busy`.

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

#### Scenario: Acciones por tarea usan Button shadcn
- **WHEN** el usuario inspecciona Editar, Guardar y Eliminar en una tarjeta en desktop y en móvil (390px)
- **THEN** los tres comparten altura, radio, tipografía y anillo de foco del `Button` shadcn (solo cambia variante/color por intención), conservan `edit-btn`, `save-btn` y `delete-btn`, y son operables por teclado y táctil sin perder el foco visible

### Requirement: Layout desktop a altura de viewport con tareas prioritarias
El sistema SHALL presentar en desktop (≥1024px) la app a la altura del viewport (`100dvh`) con la lista de tareas como región principal con scroll propio, manteniendo visibles el titular, el formulario de creación y los filtros sin desplazar las tareas fuera de pantalla. Las tareas SHALL ubicarse en la zona de mayor jerarquía visual (columna principal o primera sección visible) y nunca debajo de un formulario de altura completa. En móvil (<1024px) el apilado vertical se conserva con formulario compacto. En ambos viewports el sistema SHALL evitar scroll horizontal, garantizar dianas táctiles ≥44px de alto en móvil y mantener espaciados y jerarquía validados con `playwright-cli` (snapshot + screenshot en 1440px y 390px) y revisión `web-design-guidelines`.

#### Scenario: Altura de viewport en desktop
- **WHEN** el usuario abre la app en un viewport desktop de 1440×900
- **THEN** el contenedor raíz mide la altura del viewport sin scroll de página global y solo la región de la lista hace scroll interno

#### Scenario: Tareas visibles sin scroll inicial
- **WHEN** existen al menos 3 tareas y el usuario carga la página en desktop
- **THEN** la primera tarea es visible sin desplazar la página y el formulario no ocupa más del 40% de la altura visible

#### Scenario: Móvil conserva apilado compacto
- **WHEN** el usuario abre la app en un viewport de 390px de ancho
- **THEN** titular, formulario compacto, filtros y lista aparecen apilados y toda la página hace scroll como un único documento

#### Scenario: Sin overflow horizontal ni dianas pequeñas en móvil
- **WHEN** el usuario recorre la página en 390px con `playwright-cli snapshot` y captura
- **THEN** no hay scroll horizontal, cada botón/enlace de acción mide ≥44px de alto táctil y ningún control queda recortado o solapado

## ADDED Requirements

### Requirement: Botón shadcn reutilizable con variantes documentadas
El sistema SHALL proveer el botón de la app exclusivamente mediante `components/ui/button.tsx` (`buttonVariants` con cva) con variantes `default`, `secondary`, `outline`, `ghost` y `destructive` y tamaños `default`, `sm`, `lg`, `icon`, conservando la API (`variant`, `size`, `asChild`) y los tokens semánticos existentes.

#### Scenario: Reutilizar variantes sin estilos ad-hoc
- **WHEN** un desarrollador necesita un nuevo botón (p. ej. acción secundaria o destructiva)
- **THEN** puede componerlo solo con `variant`/`size` de `Button` sin escribir colores, radios ni focos manuales, y el resultado hereda foco visible, `disabled:opacity-50` y `active:scale`.

#### Scenario: Destructivo consistente en diálogo y fila
- **WHEN** el usuario visualiza Eliminar en la tarjeta y Confirmar en el diálogo
- **THEN** ambos usan la variante `destructive` (sólida en confirmación, fantasma o texto en fila según diseño) con el mismo tono `destructive` y contraste AA sobre su superficie.

### Requirement: Pulido validado con Playwright y guidelines
El sistema SHALL validar el pulido desktop/móvil con `playwright-cli` (`open`, `goto`, `snapshot`, `find`, `screenshot`) y revisión contra `web-design-guidelines` vigente (fetch remoto + informe `file:line`), corrigiendo hallazgos de botones, espaciado, jerarquía y accesibilidad antes de cerrar el cambio.

#### Scenario: Auditoría en dos viewports
- **WHEN** se ejecuta la revisión con `playwright-cli open` en 1440px y 390px y se toman `snapshot` + `screenshot`
- **THEN** se registra qué botones/controles difieren de shadcn y qué desbordes o solapes existen, y cada hallazgo se corrige o se justifica en el informe.

#### Scenario: Guidelines sin bloqueantes
- **WHEN** se aplica la revisión `web-design-guidelines` a `task-item.tsx`, `task-form.tsx`, `task-filters.tsx`, `button.tsx` y `globals.css`
- **THEN** no quedan violaciones bloqueantes (foco, contraste, jerarquía, consistencia de botones) o quedan documentadas como excepción aceptada.
