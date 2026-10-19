# Spec Delta: user-auth-ui

## MODIFIED Requirements

### Requirement: Botones de autenticación en el header
El sistema SHALL mostrar una navbar compartida en la landing y en la página de tareas, con la marca, los enlaces de navegación y las acciones de sesión: "Iniciar sesión" y "Registrarse" cuando no hay sesión (abriendo el modal de cuenta); y, cuando hay sesión, el avatar del usuario, el enlace "Mis tareas" y un menú de usuario que contiene "Tokens MCP" y "Cerrar sesión". Las acciones y enlaces interactivos visibles del header SHALL ofrecer un área táctil mínima de 44 × 44 píxeles CSS. Todas las acciones y enlaces de sesión de la navbar SHALL ser alcanzables en todos los anchos responsivos, incluido móvil (<640px), sin depender de un ancho mínimo de pantalla. El titular del día de la página de tareas SHALL quedar debajo de la navbar.

#### Scenario: Header sin sesión muestra botones de entrada
- **WHEN** no hay sesión de usuario autenticada
- **THEN** la navbar muestra los botones "Iniciar sesión" y "Registrarse"

#### Scenario: Header con sesión muestra avatar y cerrar sesión
- **WHEN** hay una sesión de usuario autenticada
- **THEN** la navbar muestra el avatar del usuario (imagen de Google si se autenticó con OAuth, avatar genérico si es email) y el enlace "Mis tareas", mientras que "Tokens MCP" y "Cerrar sesión" quedan disponibles desde el menú de usuario

#### Scenario: Cerrar sesión
- **WHEN** el usuario activa "Cerrar sesión" desde el menú de usuario o desde el panel móvil
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

### Requirement: Acciones de sesión en la barra móvil con sesión

Con sesión y ancho inferior a 640 px, la barra SHALL mostrar el avatar del
usuario y, a su derecha, el botón que abre el panel de navegación móvil. La
acción "Cerrar sesión" SHALL residir dentro de ese panel, no en la barra, y
SHALL conservar un área táctil de al menos 44 × 44 px CSS, foco visible y el
mismo comportamiento de invalidar la sesión y volver a la landing anónima. A
partir de 640 px el cierre de sesión SHALL residir en el menú de usuario de
escritorio, no suelto en la barra.

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
- **THEN** "Cerrar sesión" no está suelto en la barra y sigue siendo alcanzable desde el menú de usuario anclado a ella, de modo que el panel móvil no es la única vía de acceso

### Requirement: Enlace de documentación de arquitectura en la navbar
La navbar compartida SHALL ofrecer un enlace secundario hacia `/arquitectura`, rotulado para indicar que explica cómo está hecha la app, con icono, área táctil de al menos 44 × 44 px CSS, foco visible y apertura en pestaña nueva. El enlace SHALL distinguirse visualmente del resto de enlaces de la barra mediante el color de acento del sistema. Desde 640 px SHALL estar visible en la barra; por debajo de 640 px SHALL ser alcanzable desde el panel de navegación móvil cuando hay sesión, sin que ningún control del header quede recortado o desbordado.

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

#### Scenario: Enlace destacado visualmente
- **WHEN** el enlace a la documentación es visible en la barra de escritorio
- **THEN** se distingue del resto de enlaces de la barra mediante el color de acento del sistema y conserva el mismo texto, icono y área táctil

## ADDED Requirements

### Requirement: Menú de usuario en el header de escritorio

En escritorio (≥640 px) y con sesión, la barra SHALL mostrar un botón de
usuario con el avatar, el primer nombre del usuario recortado a un máximo de 10
caracteres y un indicador de despliegue. Al activarlo SHALL desplegar un menú
con exactamente dos acciones: "Tokens MCP" y "Cerrar sesión". El menú SHALL
cerrarse con Escape devolviendo el foco al botón y con un clic fuera, SHALL NOT
existir en móvil (<640 px) y sus ítems SHALL ofrecer al menos 44 × 44 px CSS
con foco visible.

#### Scenario: Disparador con avatar y nombre recortado

- **WHEN** un usuario autenticado llamado "Christopher Alexander" abre la app a 1024 px de ancho
- **THEN** la barra muestra su avatar y el nombre recortado a 10 caracteres, y no muestra "Tokens MCP" ni "Cerrar sesión" sueltos

#### Scenario: Contenido del menú de usuario

- **WHEN** el usuario activa el botón de usuario
- **THEN** el menú muestra "Tokens MCP" y "Cerrar sesión", y ninguna otra acción de cuenta

#### Scenario: Navegar a tokens desde el menú

- **WHEN** el usuario activa "Tokens MCP" en el menú
- **THEN** el navegador navega a `/mcp` y el menú se cierra

#### Scenario: Cerrar sesión desde el menú de usuario

- **WHEN** el usuario activa "Cerrar sesión" en el menú
- **THEN** la sesión se invalida y el navegador vuelve a la landing en estado anónimo

#### Scenario: Escape cierra el menú y devuelve el foco

- **WHEN** el menú está abierto y el usuario pulsa Escape
- **THEN** el menú se cierra y el foco vuelve al botón de usuario

#### Scenario: Clic fuera cierra el menú

- **WHEN** el menú está abierto y el usuario hace clic fuera de él
- **THEN** el menú se cierra

#### Scenario: Área táctil y foco visible de los ítems

- **WHEN** el menú está abierto
- **THEN** "Tokens MCP" y "Cerrar sesión" ofrecen un área de interacción de al menos 44 × 44 px CSS y un indicador de foco visible

#### Scenario: Error de cierre de sesión dentro del menú

- **WHEN** el cierre de sesión iniciado desde el menú de usuario falla
- **THEN** el menú permanece abierto y muestra un único mensaje de error en español, sin cerrar la sesión

#### Scenario: En móvil no existe el menú de usuario

- **WHEN** un usuario autenticado abre la app a 390 px de ancho
- **THEN** el botón de usuario de escritorio no está presente y las acciones siguen disponibles en el panel móvil
