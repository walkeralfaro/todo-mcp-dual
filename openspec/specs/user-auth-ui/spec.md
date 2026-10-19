# user-auth-ui Specification

## Purpose

Proporciona la interfaz de autenticación de usuario: iniciar sesión, registrarse, mostrar el estado de sesión y restringir la creación de tareas solo a usuarios autenticados.

## Requirements

### Requirement: Modal único de cuenta con pestañas login y registro
El sistema SHALL mostrar un único modal (Dialog) con dos pestañas, "Iniciar sesión" y "Registrarse", para autenticar al usuario con email y contraseña. El modal SHALL conservar los valores tecleados al cambiar de pestaña o tras un envío fallido y SHALL mostrar un único mensaje de error dentro del modal cuando la autenticación es rechazada.

#### Abrir modal de cuenta
- **WHEN** el usuario hace clic en "Iniciar sesión" o "Registrarse" en el header
- **THEN** se abre el modal con la pestaña correspondiente seleccionada y el foco en el primer campo

#### Cambiar entre pestañas
- **WHEN** el usuario hace clic en la pestaña "Registrarse" estando en "Iniciar sesión"
- **THEN** el modal muestra el formulario de registro y viceversa, conservando lo tecleado

#### Cerrar modal
- **WHEN** el usuario pulsa Escape o hace clic fuera del modal
- **THEN** el modal se cierra y vuelve a la página principal

#### Mostrar error sin cerrar el modal
- **WHEN** el servidor rechaza el registro o el inicio de sesión (credenciales inválidas, contraseña corta, correo ya registrado, error del servidor)
- **THEN** el modal permanece abierto, conserva los valores tecleados y muestra un único mensaje de error en español; si el envío tiene éxito o falla, el estado pendiente se desactiva

### Requirement: Botones de autenticación en el header
El sistema SHALL mostrar una navbar compartida en la landing y en la página de tareas, con la marca, los enlaces de navegación y las acciones de sesión: "Iniciar sesión" y "Registrarse" cuando no hay sesión (abriendo el modal de cuenta); avatar del usuario, enlaces "Mis tareas" y "Tokens MCP", y "Cerrar sesión" cuando hay sesión. Las acciones y enlaces interactivos visibles del header SHALL ofrecer un área táctil mínima de 44 × 44 píxeles CSS. Todas las acciones y enlaces de sesión de la navbar SHALL ser alcanzables en todos los anchos responsivos, incluido móvil (<640px), sin depender de un ancho mínimo de pantalla. El titular del día de la página de tareas SHALL quedar debajo de la navbar.

#### Scenario: Header sin sesión muestra botones de entrada
- **WHEN** no hay sesión de usuario autenticada
- **THEN** la navbar muestra los botones "Iniciar sesión" y "Registrarse"

#### Scenario: Header con sesión muestra avatar y cerrar sesión
- **WHEN** hay una sesión de usuario autenticada
- **THEN** la navbar muestra el avatar del usuario (imagen de Google si se autenticó con OAuth, avatar genérico si es email), los enlaces "Mis tareas" y "Tokens MCP", y el botón "Cerrar sesión"

#### Scenario: Cerrar sesión
- **WHEN** el usuario hace clic en "Cerrar sesión"
- **THEN** la sesión se invalida y el navegador vuelve a la landing en estado anónimo

#### Scenario: Inicio y cierre de sesión actualizan la vista server-rendered
- **WHEN** un usuario se autentica con éxito o cierra sesión
- **THEN** la vista server-rendered (navbar, formulario de creación, listado y titular del día) se refleja sin recarga manual del navegador

#### Scenario: Misma navbar en landing y app
- **WHEN** el usuario navega entre `/` y `/tareas`
- **THEN** la navbar mantiene estructura, marca y acciones de sesión en ambas páginas

#### Scenario: Controles del header cómodos al tacto
- **WHEN** la navbar muestra acciones interactivas en cualquier ancho responsive
- **THEN** cada botón y enlace visible ofrece un área de interacción de al menos 44 × 44 píxeles CSS y conserva un indicador de foco visible

#### Scenario: Enlaces de sesión alcanzables en móvil
- **WHEN** un usuario autenticado abre la app a 390px de ancho
- **THEN** puede alcanzar desde la navbar los enlaces "Mis tareas" y "Tokens MCP" (visibles o tras desplegar una navegación móvil accesible), además de "Cerrar sesión", sin que ningún control quede oculto ni recortado

### Requirement: Creación de tareas solo para usuarios autenticados
El sistema SHALL permitir crear, editar y eliminar tareas únicamente cuando exista una sesión de usuario autenticada. La página de tareas SHALL existir solo en `/tareas` y SHALL estar protegida (ver "Rutas protegidas de la aplicación"), de modo que el formulario de creación esté siempre presente para el usuario autenticado y nunca se oculte condicionalmente dentro de la página.

#### Scenario: Formulario de creación sin sesión
- **WHEN** no hay sesión de usuario autenticada
- **THEN** el sistema no muestra ningún formulario de creación: no existe acceso a la página de tareas y el visitante es redirigido a la landing con el modal de acceso abierto

#### Scenario: Formulario siempre presente con sesión
- **WHEN** un usuario autenticado abre `/tareas`
- **THEN** el formulario de creación está visible y operativo, junto con filtros, listado y titular del día

#### Scenario: Crear tarea con sesión
- **WHEN** hay una sesión de usuario autenticada y el usuario envía el formulario de creación
- **THEN** la tarea se crea asociada al usuario autenticado y aparece en su listado

#### Scenario: Lista de tareas por usuario
- **WHEN** hay una sesión de usuario autenticada
- **THEN** el listado muestra solo las tareas de ese usuario y el titular del día refleja sus pendientes

### Requirement: Rutas protegidas de la aplicación
El sistema SHALL exigir sesión autenticada para `/tareas` y `/mcp`, redirigiendo al visitante anónimo a la landing con el modal de acceso abierto en la pestaña de inicio de sesión y el parámetro `next` con la ruta solicitada (`/?auth=login&next=<ruta>`). La protección SHALL aplicarse antes de renderizar contenido protegido y SHALL NOT depender de ocultar componentes dentro de la página.

#### Scenario: Deep link a tareas sin sesión
- **WHEN** un visitante sin sesión solicita `/tareas`
- **THEN** es redirigido a `/?auth=login&next=/tareas` con el modal de acceso abierto

#### Scenario: Deep link a tokens sin sesión
- **WHEN** un visitante sin sesión solicita `/mcp`
- **THEN** es redirigido a `/?auth=login&next=/mcp` con el modal de acceso abierto

#### Scenario: Cookie inválida no accede
- **WHEN** una solicitud llega a `/tareas` con cookie de sesión caducada o inválida
- **THEN** el sistema no renderiza contenido protegido y redirige a la landing con el modal de acceso abierto

#### Scenario: Con sesión se accede
- **WHEN** un usuario autenticado solicita `/tareas` o `/mcp`
- **THEN** el sistema renderiza la página protegida correspondiente

### Requirement: Acceso dirigido y retorno tras autenticarse
La landing SHALL interpretar los parámetros `auth` y `next` para abrir el modal de cuenta en la pestaña solicitada. Tras una autenticación exitosa (email/contraseña o Google), el sistema SHALL navegar a `next` cuando sea una ruta local válida (comienza por `/` y no por `//`) y a `/tareas` en caso contrario.

#### Scenario: Retorno a la ruta solicitada
- **WHEN** el usuario llega desde `/?auth=login&next=/mcp` e inicia sesión con éxito
- **THEN** el navegador navega a `/mcp`

#### Scenario: Pestaña solicitada respetada
- **WHEN** el usuario abre `/?auth=register`
- **THEN** el modal aparece en la pestaña "Registrarse"

#### Scenario: Next inválido se ignora
- **WHEN** el parámetro `next` no es una ruta local válida (por ejemplo `https://ejemplo.com` o `//evil`),
- **THEN** tras autenticarse se navega a `/tareas`

#### Scenario: Google respeta el retorno
- **WHEN** el usuario completa el flujo de Google iniciado desde un redirect de protección
- **THEN** vuelve a la ruta `next` solicitada

### Requirement: Inicio de sesión con Google en el modal
El sistema SHALL ofrecer en el modal de cuenta un botón "Continuar con Google" que inicia el flujo de OAuth de Google, junto a las pestañas de email y contraseña.

#### Botón de Google abre el flujo OAuth
- **WHEN** el usuario hace clic en "Continuar con Google" en el modal de cuenta
- **THEN** el navegador se redirige al flujo de OAuth de Google para completar la autenticación

### Requirement: Enlace de documentación de arquitectura en la navbar
La navbar compartida SHALL ofrecer un enlace secundario hacia `/arquitectura`, rotulado para indicar que explica cómo está hecha la app, con icono, área táctil de al menos 44 × 44 px CSS, foco visible y apertura en pestaña nueva. Desde 640 px SHALL estar visible en la barra; por debajo de 640 px SHALL ser alcanzable desde el panel de navegación móvil cuando hay sesión, sin que ningún control del header quede recortado o desbordado.

#### Scenario: Enlace visible en la barra desde 640 px
- **WHEN** se abre cualquier página del sitio a 640 px o más de ancho
- **THEN** la barra muestra el enlace a la documentación y, al activarlo, la documentación se abre en una pestaña nueva

#### Scenario: Enlace alcanzable en móvil con sesión
- **WHEN** un usuario autenticado abre la app a 390 px de ancho
- **THEN** puede alcanzar el enlace a la documentación desde el panel de navegación móvil, junto a los enlaces de sesión, sin que ningún control quede oculto ni recortado

#### Scenario: Header anónimo en móvil sin recortes
- **WHEN** un visitante sin sesión abre la landing a 390 px de ancho
- **THEN** la barra mantiene la marca y las acciones de acceso sin desbordar, y la documentación sigue siendo alcanzable desde el pie de la landing

#### Scenario: Área táctil y foco visible
- **WHEN** el enlace a la documentación es visible en la barra o en el panel móvil
- **THEN** ofrece un área de interacción de al menos 44 × 44 px CSS y un indicador de foco visible al navegar con teclado

#### Scenario: El orden de tabulación no se altera
- **WHEN** un visitante anónimo recorre la cabecera solo con teclado
- **THEN** el primer elemento enfocable sigue siendo la marca y las acciones de acceso se alcanzan antes que el enlace a la documentación

### Requirement: Acciones de sesión en la barra móvil con sesión

Con sesión y ancho inferior a 640 px, la barra SHALL mostrar el avatar del
usuario y, a su derecha, el botón que abre el panel de navegación móvil. La
acción "Cerrar sesión" SHALL residir dentro de ese panel, no en la barra, y
SHALL conservar un área táctil de al menos 44 × 44 px CSS, foco visible y el
mismo comportamiento de invalidar la sesión y volver a la landing anónima. A
partir de 640 px la barra SHALL mantener "Cerrar sesión" visible como hasta
ahora.

#### Scenario: Orden de los controles en la barra móvil

- **WHEN** un usuario autenticado abre la app a 390 px de ancho
- **THEN** la barra muestra el avatar del usuario y, a su derecha, el botón de menú, y no muestra "Cerrar sesión"

#### Scenario: Cerrar sesión desde el panel móvil

- **WHEN** un usuario autenticado a 390 px despliega el panel de navegación móvil y activa "Cerrar sesión"
- **THEN** la sesión se invalida y el navegador vuelve a la landing en estado anónimo

#### Scenario: Área táctil del cierre de sesión móvil

- **WHEN** "Cerrar sesión" es visible dentro del panel de navegación móvil
- **THEN** ofrece un área de interacción de al menos 44 × 44 px CSS y un indicador de foco visible al navegar con teclado

#### Scenario: Error de cierre de sesión junto a la acción

- **WHEN** el cierre de sesión iniciado desde el panel móvil falla
- **THEN** el panel permanece abierto y muestra un único mensaje de error en español, sin cerrar la sesión

#### Scenario: Escritorio conserva el cierre de sesión en la barra

- **WHEN** un usuario autenticado abre la app a 640 px o más de ancho
- **THEN** "Cerrar sesión" sigue visible en la barra y el panel móvil no es la única vía de acceso

