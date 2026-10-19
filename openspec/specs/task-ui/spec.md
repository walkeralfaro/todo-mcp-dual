# task-ui Specification

## Purpose

Define la pantalla protegida `/tareas` —formulario de creación, listado,
filtros, buscador y titular del día— y el sistema de componentes, tipografía,
color y movimiento que comparten las pantallas de la aplicación.

## Requirements

### Requirement: La UI de tareas vive en /tareas
La interfaz de gestión de tareas (titular del día, formulario de creación, filtros, listado y footer) SHALL servirse en la ruta `/tareas`, protegida por sesión, sin cambios de comportamiento ni de layout respecto a la implementación actual.

#### Scenario: App completa en la ruta nueva
- **WHEN** un usuario autenticado abre `/tareas`
- **THEN** ve titular, formulario, filtros y listado operando igual que antes del cambio de ruta

#### Scenario: La raíz no sirve la app
- **WHEN** se solicita `/`
- **THEN** el sistema sirve la landing pública y no la interfaz de tareas

### Requirement: CRUD completo desde la UI
El sistema SHALL permitir desde la interfaz crear, editar título/descripción, cambiar estado mediante desplegable shadcn y eliminar tareas con diálogo de confirmación shadcn, reflejando cada cambio de inmediato en el listado, todo dentro del ámbito de tareas del usuario autenticado.

#### Scenario: Editar y cambiar estado
- **WHEN** el usuario edita el título y mueve la tarea a COMPLETADA desde el desplegable shadcn
- **THEN** el listado muestra los nuevos datos y la tarea aparece como completada

#### Scenario: Eliminar con confirmación
- **WHEN** el usuario confirma el borrado en el diálogo shadcn
- **THEN** la tarea desaparece del listado y ya no es recuperable por listado ni detalle

#### Scenario: Cancelar borrado no elimina
- **WHEN** el usuario abre el diálogo de borrado y activa Cancelar o pulsa Escape
- **THEN** el diálogo se cierra, el foco vuelve al botón Eliminar que lo abrió y la tarea sigue en el listado

#### Scenario: Usuario no puede editar tarea de otro usuario
- **WHEN** un usuario intenta editar o eliminar una tarea asociada a otro `userId`
- **THEN** el sistema rechaza la operación con error de autorización

### Requirement: Formulario de creación con errores anunciados
El formulario de creación SHALL exponer etiqueta visible por campo, asociar errores con `aria-describedby` + `aria-invalid`, anunciarlos con `role="alert"` y mantener los `data-testid` existentes. El envío SHALL mostrar estado pendiente con indicador accesible, sin deshabilitarse antes de iniciar la petición.

#### Scenario: Etiquetas y error anunciado al crear
- **WHEN** el usuario intenta crear una tarea con título vacío
- **THEN** el campo título queda marcado `aria-invalid="true"`, el mensaje en español aparece junto al campo con `role="alert"` y el foco se mueve al primer campo con error

#### Scenario: Estado pendiente accesible
- **WHEN** el usuario envía el formulario de creación
- **THEN** el botón muestra indicador de carga con texto "Creando…" y `aria-busy`, permanece deshabilitado solo durante la petición y conserva `data-testid="create-btn"`

### Requirement: Filtros y buscador accesibles
El filtro de estado SHALL presentarse como control segmentado con una sola opción activa (pastilla elevada distinguible, navegable por teclado) y la búsqueda SHALL presentarse como campo elevado distinguible de filtros y tareas, aplicar debounce (~300 ms), ofrecer botón para limpiar y anunciar el número de resultados con `aria-live="polite"`. El foco del buscador SHALL dibujarse íntegramente dentro de su caja (sin recortes por contenedores con scroll) y seguir siendo visible a teclado.

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

### Requirement: Titular del día con cifra de pendientes
El sistema SHALL mostrar como único titular destacado el repaso del día con la cifra de tareas no completadas del usuario autenticado (p. ej. "Hoy quedan 3") a tamaño héroe (5–7vw), recalculada al completar o crear tareas. La cifra SHALL contar todas las tareas no completadas del usuario, con independencia del filtro de estado activo, de la búsqueda activa y del máximo de filas que muestre el listado.

#### Scenario: Cifra visible al cargar
- **WHEN** el usuario abre la página con 3 tareas PENDIENTE o EN_PROCESO asociadas a su `userId`
- **THEN** el titular muestra la cifra 3 junto al texto del día

#### Scenario: Cifra recalcula al completar
- **WHEN** el usuario mueve una tarea a COMPLETADA
- **THEN** el titular decrementa su cifra sin recarga manual

#### Scenario: Cifra independiente del filtro y la búsqueda
- **WHEN** el usuario tiene 3 tareas no completadas y activa el filtro COMPLETADA, o busca un texto que solo coincide con tareas completadas
- **THEN** el titular sigue mostrando la cifra 3, mientras el listado queda vacío o solo con las coincidencias

#### Scenario: Cifra no limitada por la ventana del listado
- **WHEN** el usuario tiene más tareas no completadas que el máximo de filas que muestra el listado
- **THEN** el titular muestra el total real de no completadas y no el número de filas visibles

### Requirement: Pulso neón al descontar una tarea
El sistema SHALL acompañar el cambio de la cifra del titular con un pulso visible al descontar, sin recarga manual: la cifra en neón emite un pulso breve (solo `opacity`/`transform`, ≤300ms) y queda legible en su valor final.

#### Scenario: Pulso neón al descontar
- **WHEN** el usuario completa una tarea y la cifra del titular cambia
- **THEN** la cifra emite un pulso breve (solo `opacity`/`transform`, ≤300ms) en neón y queda legible en su valor final

### Requirement: Listado de tareas como tarjetas elevadas
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
La UI SHALL usar tema oscuro "turno de noche" (fondo noche profunda, superficies por escalones de tono, sin degradados), Albert Sans (display semibold + texto regular/medium), cuerpo a 17–19px en tinta plena, y reservar el neón menta exclusivamente a la cifra viva del día, al botón primario y al estado COMPLETADA.

#### Scenario: Acento único
- **WHEN** se inspecciona la página con tareas en varios estados
- **THEN** el neón aparece solo en la cifra del día, la acción primaria y la marca de COMPLETADA, nunca en filtros ni textos secundarios

#### Scenario: Contraste de texto
- **WHEN** se mide el contraste del cuerpo y del neón sobre el fondo oscuro
- **THEN** el texto de cuerpo cumple AA y el neón cumple AA para texto o se usa solo en elementos grandes/no textuales

### Requirement: Jerarquía tipográfica y foco visible
El formulario y los filtros SHALL aplicar jerarquía (título de sección 18–20px semibold con `text-balance`, etiquetas 14px medium, ayuda/error 13–14px) y todo control interactivo SHALL mostrar foco visible de 2px con offset (anillo interior no recortable en el buscador) con contraste AA sobre cada superficie oscura.

#### Scenario: Jerarquía y foco visibles
- **WHEN** se inspeccionan el formulario de creación y los filtros
- **THEN** el título de sección es el texto de mayor peso/tamaño, las etiquetas son secundarias y cada control muestra anillo de foco de 2px al navegar por teclado sin usar `outline-none` sin reemplazo

#### Scenario: Contraste sobre superficies elevadas
- **WHEN** se mide el texto secundario sobre la card del formulario en tema oscuro
- **THEN** el ratio cumple AA (≥4.5:1) aunque el fondo de la card difiera del fondo de página

### Requirement: Superficies elevadas distinguibles del fondo
La card del formulario de creación y el menú del desplegable de estado SHALL distinguirse del fondo mediante superficie elevada (fondo más claro que `ground`, borde sutil y sombra), de modo que no se confundan con el fondo de página. El texto `muted` sobre superficies SHALL cumplir contraste AA (≥4.5:1).

#### Scenario: Card distinguible del fondo
- **WHEN** el usuario visualiza el formulario de creación junto al fondo de página
- **THEN** la card presenta borde y elevación propios y su perímetro es identificable sin depender solo del tono

#### Scenario: Muted legible sobre superficies
- **WHEN** se mide el contraste del texto secundario sobre la card y sobre el menú desplegable
- **THEN** el ratio es ≥4.5:1 en ambos casos

### Requirement: Desplegables y diálogos shadcn sin alerts nativos
El sistema SHALL implementar todo desplegable de la UI (incluido el cambio de estado por tarea) con el componente shadcn `Select` (Radix) accesible por teclado, y toda confirmación modal (incluido el borrado) con `Dialog` o `AlertDialog` shadcn con foco gestionado, cierre por Escape y botones explícitos. El sistema SHALL NOT usar `window.alert`, `window.confirm` ni `window.prompt`. Cada control shadcn SHALL conservar su `data-testid` y el anillo de foco visible de 2px.

#### Scenario: Cambio de estado con Select shadcn
- **WHEN** el usuario abre el desplegable de estado de una tarea por teclado y elige EN_PROCESO
- **THEN** el menú se abre/cierra con Enter/Escape, la opción queda seleccionada, el cambio persiste y el control conserva `data-testid="status-select"`

#### Scenario: Borrado con diálogo shadcn
- **WHEN** el usuario activa Eliminar en una tarea
- **THEN** se abre un diálogo con título, descripción y botones Cancelar/Eliminar, el foco entra al diálogo, Escape o Cancelar lo cierra sin borrar, y Confirmar elimina la tarea

#### Scenario: Ausencia de alerts nativos
- **WHEN** se ejecuta la suite E2E con diálogos nativos auto-descartados o espiando `window.confirm`
- **THEN** ningún flujo invoca `window.alert` ni `window.confirm` y todos los borrados pasan por el diálogo shadcn

### Requirement: Transiciones suaves con reduced-motion
El diálogo de confirmación y el desplegable de estado SHALL abrirse y cerrarse con transición visible (fundido + escala desde 0.95, ≤300ms, `ease-out` al entrar), y los botones y filas SHALL responder al hover/active solo con cambios de `transform`/`opacity`. Con `prefers-reduced-motion` el sistema SHALL suprimir el movimiento (fundido breve o sin animación) manteniendo el contenido y el foco.

#### Scenario: Diálogo entra con transición
- **WHEN** el usuario activa Eliminar en una tarea
- **THEN** el diálogo aparece con fundido y escala progresivos en lugar de mostrarse de golpe

#### Scenario: Movimiento reducido respetado
- **WHEN** el usuario opera con `prefers-reduced-motion` activado
- **THEN** abrir el diálogo o el desplegable no produce desplazamiento, escala ni zoom perceptibles y el foco sigue gestionado

### Requirement: Layout desktop a altura de viewport con tareas prioritarias
El sistema SHALL presentar en desktop (≥1024px) la app a la altura del viewport (`100dvh`) con la lista de tareas como región principal con scroll propio, manteniendo visibles el titular, el formulario de creación y los filtros sin desplazar las tareas fuera de pantalla. Las tareas SHALL ubicarse en la zona de mayor jerarquía visual y nunca debajo de un formulario de altura completa.

#### Scenario: Altura de viewport en desktop
- **WHEN** el usuario abre la app en un viewport desktop de 1440×900
- **THEN** el contenedor raíz mide la altura del viewport sin scroll de página global y solo la región de la lista hace scroll interno

#### Scenario: Tareas visibles sin scroll inicial
- **WHEN** existen al menos 3 tareas y el usuario carga la página en desktop
- **THEN** la primera tarea es visible sin desplazar la página y el formulario no ocupa más del 40% de la altura visible

### Requirement: Apilado y dianas táctiles en móvil
En móvil (<1024px) el sistema SHALL conservar el apilado vertical con formulario compacto, evitar el scroll horizontal y garantizar dianas táctiles de al menos 44px de alto en cada control de acción.

#### Scenario: Móvil conserva apilado compacto
- **WHEN** el usuario abre la app en un viewport de 390px de ancho
- **THEN** titular, formulario compacto, filtros y lista aparecen apilados y toda la página hace scroll como un único documento

#### Scenario: Sin overflow horizontal ni dianas pequeñas en móvil
- **WHEN** el usuario recorre la página en 390px
- **THEN** no hay scroll horizontal, cada botón/enlace de acción mide ≥44px de alto táctil y ningún control queda recortado o solapado

### Requirement: Botón shadcn reutilizable con variantes documentadas
El sistema SHALL proveer el botón de la app exclusivamente mediante `components/ui/button.tsx` (`buttonVariants` con cva) con variantes `default`, `secondary`, `outline`, `ghost` y `destructive` y tamaños `default`, `sm`, `lg`, `icon`, conservando la API (`variant`, `size`, `asChild`) y los tokens semánticos existentes.

#### Scenario: Reutilizar variantes sin estilos ad-hoc
- **WHEN** un desarrollador necesita un nuevo botón (p. ej. acción secundaria o destructiva)
- **THEN** puede componerlo solo con `variant`/`size` de `Button` sin escribir colores, radios ni focos manuales, y el resultado hereda foco visible, `disabled:opacity-50` y `active:scale`

#### Scenario: Destructivo consistente en diálogo y fila
- **WHEN** el usuario visualiza Eliminar en la tarjeta y Confirmar en el diálogo
- **THEN** ambos usan la variante `destructive` (sólida en confirmación, fantasma o texto en fila según diseño) con el mismo tono `destructive` y contraste AA sobre su superficie

#### Scenario: Acciones por tarea usan Button shadcn
- **WHEN** el usuario inspecciona Editar, Guardar y Eliminar en una tarjeta en desktop y en móvil (390px)
- **THEN** los tres comparten altura, radio, tipografía y anillo de foco del `Button` shadcn (solo cambia variante/color por intención), conservan `edit-btn`, `save-btn` y `delete-btn`, y son operables por teclado y táctil sin perder el foco visible

### Requirement: Flujos y selectores de test estables
El sistema SHALL conservar todos los flujos (crear, filtrar, buscar, editar, cambiar estado, eliminar con confirmación) y todos los `data-testid` existentes de la UI de tareas, que vive en la ruta protegida `/tareas`.

#### Scenario: Flujo completo conservado
- **WHEN** el usuario autenticado opera `/tareas`
- **THEN** los controles conservan los `data-testid` existentes (`new-title`, `create-btn`, `filter-*`, `edit-btn`, `save-btn`, `delete-btn`, `status-select`, entre otros)

### Requirement: Specs E2E apuntan a /tareas
Los specs E2E SHALL entrar por `/tareas` tras iniciar sesión y la suite `npx playwright test` SHALL quedar en verde conservando los flujos y selectores existentes.

#### Scenario: E2E en verde con la nueva entrada
- **WHEN** se ejecuta `npx playwright test` con los specs actualizados (`todo.spec.ts`, `todo-auth.spec.ts`)
- **THEN** los flujos completos entran por `/tareas` tras iniciar sesión y terminan en verde conservando sus `data-testid`

#### Scenario: E2E sin cambios de contrato
- **WHEN** se ejecuta `npx playwright test` sobre los flujos de tareas
- **THEN** el flujo completo (registro/login, crear, filtrar, buscar, editar, completar, borrar) termina en verde conservando sus `data-testid` sin cambios
