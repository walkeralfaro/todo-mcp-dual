# Spec Delta

## Purpose

Autentica y autoriza usuarios de la Todo App, aísla su contenido (tareas) por identidad y permite la autenticación de clientes MCP mediante tokens de acceso.

## ADDED Requirements

### Requirement: Autenticación de usuario con email y contraseña
El sistema SHALL permitir a un usuario registrarse e iniciar sesión con email y contraseña, creando una sesión de usuario autenticada.

#### Usuario se registra con email y contraseña
- **WHEN** un usuario proporciona email y contraseña válidos
- **THEN** se crea una cuenta de usuario y se inicia una sesión autenticada

#### Contraseña incorrecta rechaza el acceso
- **WHEN** un usuario intenta iniciar sesión con contraseña incorrecta
- **THEN** el sistema rechaza la autenticación con un error en español

### Requirement: Inicio de sesión con Google OAuth
El sistema SHALL permitir a un usuario autenticarse mediante Google OAuth, vinculando su cuenta de Google a una cuenta de usuario de la Todo App.

#### Usuario se autentica con Google OAuth
- **WHEN** un usuario elige iniciar sesión con Google y completa el flujo de OAuth
- **THEN** se vincula su cuenta de Google y se inicia una sesión autenticada

### Requirement: Gestión de sesiones de usuario
El sistema SHALL mantener una sesión de usuario autenticada entre solicitudes y permitir cerrar la sesión.

#### Sesión persiste entre solicitudes
- **WHEN** un usuario ha iniciado sesión y realiza una solicitud posterior
- **THEN** el sistema reconoce al usuario autenticado sin requerir nuevo login

#### Usuario cierra sesión
- **WHEN** un usuario autenticado cierra sesión
- **THEN** la sesión se invalida y el usuario ya no está autenticado

### Requirement: Aislamiento de tareas por usuario
El sistema SHALL asociar cada tarea al usuario autenticado que la creó y asegurar que un usuario solo pueda acceder a sus propias tareas.

#### Tarea pertenece al usuario creador
- **WHEN** un usuario autenticado crea una tarea
- **THEN** la tarea queda asociada al `userId` de ese usuario

#### Usuario no ve tareas de otros usuarios
- **WHEN** un usuario autenticado lista sus tareas
- **THEN** solo se muestran las tareas asociadas a su `userId`, nunca tareas de otros usuarios

### Requirement: Autenticación de clientes MCP mediante Bearer token
El sistema SHALL exigir un token de acceso válido en la cabecera `Authorization` para invocar herramientas del servidor MCP, resolviendo el token a un `userId`.

#### Cliente MCP invoca tool con token válido
- **WHEN** un cliente MCP envía una solicitud con `Authorization: Bearer <token>` válido
- **THEN** el sistema resuelve el token a un `userId` y ejecuta la tool en nombre de ese usuario

#### Cliente MCP invoca tool sin token es rechazado
- **WHEN** un cliente MCP invoca una tool sin cabecera `Authorization` o con token inválido
- **THEN** el sistema rechaza la solicitud con un error de autenticación
