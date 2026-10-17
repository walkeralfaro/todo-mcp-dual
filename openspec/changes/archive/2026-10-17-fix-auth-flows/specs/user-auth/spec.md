# Spec Delta: user-auth

## MODIFIED Requirements

### Requirement: Autenticación de usuario con email y contraseña
El sistema SHALL permitir a un usuario registrarse e iniciar sesión con email y contraseña, creando una sesión de usuario autenticada. La contraseña de registro SHALL tener una longitud mínima de 8 caracteres y los rechazos de registro e inicio de sesión SHALL comunicarse con mensajes claros en español.

#### Usuario se registra con email y contraseña
- **WHEN** un usuario proporciona email y contraseña válidos (longitud mínima de 8)
- **THEN** se crea una cuenta de usuario y se inicia una sesión autenticada

#### Contraseña incorrecta rechaza el acceso
- **WHEN** un usuario intenta iniciar sesión con contraseña incorrecta
- **THEN** el sistema rechaza la autenticación con un error en español

#### Contraseña demasiado corta rechaza el registro
- **WHEN** un usuario intenta registrarse con una contraseña de menos de 8 caracteres
- **THEN** el sistema rechaza el registro con un mensaje en español que indica la longitud mínima exigida

#### Registro con correo ya existente rechaza
- **WHEN** un usuario intenta registrarse con un correo que ya tiene cuenta
- **THEN** el sistema rechaza el registro con un mensaje de error en español

### Requirement: Gestión de sesiones de usuario
El sistema SHALL mantener una sesión de usuario autenticada entre solicitudes y permitir cerrar la sesión. Cada solicitud del navegador (render del servidor y Server Actions) SHALL resolver la sesión a partir de las cookies de esa solicitud, sin dependencias de estado del cliente ni recargas manuales.

#### Sesión persiste entre solicitudes
- **WHEN** un usuario ha iniciado sesión y realiza una solicitud posterior
- **THEN** el sistema reconoce al usuario autenticado sin requerir nuevo login

#### El servidor resuelve la sesión desde las cookies de la solicitud
- **WHEN** un usuario con cookie de sesión válida solicita la página principal o invoca una Server Action
- **THEN** el render del servidor y la acción resuelven la sesión desde las cookies de la solicitud y aplican sus reglas de autenticación, sin requerir una nueva autenticación ni una recarga manual

#### Usuario cierra sesión
- **WHEN** un usuario autenticado cierra sesión
- **THEN** la sesión se invalida y el usuario ya no está autenticado
