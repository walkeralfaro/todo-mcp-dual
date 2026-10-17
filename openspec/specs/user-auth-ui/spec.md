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
El sistema SHALL mostrar botones de autenticación en el header junto al titular del día: "Iniciar sesión" y "Registrarse" cuando no hay sesión; avatar del usuario y "Cerrar sesión" cuando hay sesión.

#### Header sin sesión muestra botones de entrada
- **WHEN** no hay sesión de usuario autenticada
- **THEN** el header muestra botones "Iniciar sesión" y "Registrarse"

#### Header con sesión muestra avatar y cerrar sesión
- **WHEN** hay una sesión de usuario autenticada
- **THEN** el header muestra el avatar del usuario (imagen de Google si se autenticó con OAuth, avatar genérico si es email) y un botón "Cerrar sesión"

#### Cerrar sesión
- **WHEN** el usuario hace clic en "Cerrar sesión"
- **THEN** la sesión se invalida y la página vuelve al estado sin sesión

#### Inicio y cierre de sesión actualizan la vista server-rendered
- **WHEN** un usuario se autentica con éxito o cierra sesión
- **THEN** la vista server-rendered (formulario de creación, listado y titular del día) se refleja sin recarga manual del navegador

### Requirement: Creación de tareas solo para usuarios autenticados
El sistema SHALL permitir crear, editar y eliminar tareas únicamente cuando exista una sesión de usuario autenticada. Sin sesión no se muestra el formulario de creación y el estado vacío del listado no invita a crear tareas.

#### Formulario de creación sin sesión
- **WHEN** no hay sesión de usuario autenticada
- **THEN** no se muestra el formulario de creación de tareas y el estado vacío del listado indica que hay que iniciar sesión para crear tareas

#### Crear tarea con sesión
- **WHEN** hay una sesión de usuario autenticada y el usuario envía el formulario de creación
- **THEN** la tarea se crea asociada al usuario autenticado y aparece en su listado

#### Lista de tareas por usuario
- **WHEN** hay una sesión de usuario autenticada
- **THEN** el listado muestra solo las tareas de ese usuario y el titular del día refleja sus pendientes

### Requirement: Inicio de sesión con Google en el modal
El sistema SHALL ofrecer en el modal de cuenta un botón "Continuar con Google" que inicia el flujo de OAuth de Google, junto a las pestañas de email y contraseña.

#### Botón de Google abre el flujo OAuth
- **WHEN** el usuario hace clic en "Continuar con Google" en el modal de cuenta
- **THEN** el navegador se redirige al flujo de OAuth de Google para completar la autenticación
