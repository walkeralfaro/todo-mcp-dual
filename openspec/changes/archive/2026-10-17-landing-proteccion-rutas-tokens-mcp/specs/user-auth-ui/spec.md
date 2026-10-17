# Spec Delta: user-auth-ui

## MODIFIED Requirements

### Requirement: Botones de autenticación en el header
El sistema SHALL mostrar una navbar compartida en la landing y en la página de tareas, con la marca, los enlaces de navegación y las acciones de sesión: "Iniciar sesión" y "Registrarse" cuando no hay sesión (abriendo el modal de cuenta); avatar del usuario, enlaces "Mis tareas" y "Tokens MCP", y "Cerrar sesión" cuando hay sesión. El titular del día de la página de tareas SHALL quedar debajo de la navbar.

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

## ADDED Requirements

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
