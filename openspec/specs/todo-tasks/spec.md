# todo-tasks Specification

## Purpose

Permite a usuarios web gestionar tareas (crear, listar, filtrar, editar y eliminar) con un estado único persistente y validado.

## Requirements

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

### Requirement: Ciclo de vida de fechaCulminada
El sistema SHALL asignar fechaCulminada al entrar en COMPLETADA y limpiarla (null) al salir hacia PENDIENTE o EN_PROCESO; las transiciones entre los tres estados son libres.

#### Scenario: Completar asigna fecha
- **WHEN** una tarea pasa a COMPLETADA
- **THEN** fechaCulminada queda con la fecha-hora actual

#### Scenario: Reabrir limpia fecha
- **WHEN** una tarea COMPLETADA pasa a PENDIENTE o EN_PROCESO
- **THEN** fechaCulminada vuelve a null

### Requirement: Validación de entrada en español
El sistema SHALL rechazar títulos vacíos o de más de 100 caracteres y descripciones de más de 500 caracteres, devolviendo mensajes de error en español.

#### Scenario: Título vacío rechazado
- **WHEN** se intenta crear una tarea con título vacío
- **THEN** la operación falla con mensaje "El título es obligatorio"

#### Scenario: Límites de longitud
- **WHEN** se envía título de 101 caracteres o descripción de 501
- **THEN** la operación falla con mensaje de máximo excedido

### Requirement: Listado con filtros, búsqueda y orden
El sistema SHALL listar tareas ordenadas por fechaCreacion descendente, con filtro por estado (TODAS/PENDIENTE/EN_PROCESO/COMPLETADA) y búsqueda por texto en título/descripción, siempre filtradas por el `userId` del usuario autenticado. El filtro de estado SHALL presentarse como control segmentado con una sola opción activa (pastilla elevada distinguible, navegable por teclado) y la búsqueda SHALL presentarse como campo elevado distinguible de filtros y tareas, aplicar debounce (~300 ms), ofrecer botón para limpiar y anunciar el número de resultados con `aria-live="polite"`. El foco del buscador SHALL dibujarse íntegramente dentro de su caja (sin recortes por contenedores con scroll) y seguir siendo visible a teclado.

#### Listar tareas filtra por usuario
- **WHEN** un usuario autenticado lista sus tareas
- **THEN** solo se muestran tareas asociadas a su `userId`, ordenadas de más reciente a más antigua

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

### Requirement: CRUD completo desde la UI
El sistema SHALL permitir desde la interfaz crear, editar título/descripción, cambiar estado mediante desplegable shadcn y eliminar tareas con diálogo de confirmación shadcn, reflejando cada cambio de inmediato en el listado, todo dentro del ámbito de tareas del usuario autenticado. El formulario de creación SHALL exponer etiqueta visible por campo, asociar errores con `aria-describedby` + `aria-invalid`, anunciarlos con `role="alert"`, mantener `data-testid` existentes y mostrar estado pendiente con indicador accesible sin deshabilitar el envío antes de iniciar la petición. Todos los botones de acción por tarea (Editar, Guardar, Eliminar) y del diálogo (Cancelar, Confirmar) SHALL implementarse con el componente shadcn `Button` con variante y tamaño coherentes, preservando `data-testid`, foco visible de 2px y estados `disabled`/`aria-busy`.

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

### Requirement: Flujos y selectores de test estables
El rediseño SHALL conservar todos los flujos (crear, filtrar, buscar, editar, cambiar estado, eliminar con confirmación) y todos los `data-testid` existentes, de modo que el E2E actual pasa sin modificaciones.

#### Scenario: E2E sin cambios
- **WHEN** se ejecuta `npx playwright test` con el spec `e2e/todo.spec.ts` actual
- **THEN** el flujo completo (crear, filtrar, editar, completar, borrar) termina en verde

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
