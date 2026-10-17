# Spec Delta

## Purpose

Proporciona la interfaz de autenticación de usuario: iniciar sesión, registrarse, mostrar el estado de sesión y restringir la creación de tareas solo a usuarios autenticados.

## ADDED Requirements

### Requirement: Modal único de cuenta con pestañas login y registro
El sistema SHALL mostrar un único modal (Dialog shadcn) con dos pestañas, "Iniciar sesión" y "Registrarse", para autenticar al usuario con email y contraseña.

#### Abrir modal de cuenta
- **WHEN** el usuario hace clic en "Iniciar sesión" o "Registrarse" en el header
- **THEN** se abre el modal con la pestaña correspondiente seleccionada

#### Cambiar entre pestañas
- **WHEN** el usuario hace clic en la pestaña "Registrarse" estando en "Iniciar sesión"
- **THEN** el modal muestra el formulario de registro y viceversa

#### Cerrar modal
- **WHEN** el usuario pulsa Escape o hace clic fuera del modal
- **THEN** el modal se cierra y vuelve a la página principal

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

### Requirement: Creación de tareas solo para usuarios autenticados
El sistema SHALL permitir crear, editar y eliminar tareas únicamente cuando exista una sesión de usuario autenticada. Sin sesión no se muestra el formulario de creación.

#### Formulario de creación sin sesión
- **WHEN** no hay sesión de usuario autenticada
- **THEN** no se muestra el formulario de creación de tareas

#### Crear tarea con sesión
- **WHEN** hay una sesión de usuario autenticada y el usuario envía el formulario de creación
- **THEN** la tarea se crea asociada al usuario autenticado y aparece en su listado

#### Lista de tareas por usuario
- **WHEN** hay una sesión de usuario autenticada
- **THEN** el listado muestra solo las tareas de ese usuario y el titular del día refleja sus pendientes
