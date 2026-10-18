# Spec Delta

## MODIFIED Requirements

### Requirement: Botones de autenticación en el header
El sistema SHALL mostrar una navbar compartida en la landing y en la página de tareas, con la marca, los enlaces de navegación y las acciones de sesión: "Iniciar sesión" y "Registrarse" cuando no hay sesión (abriendo el modal de cuenta); avatar del usuario, enlaces "Mis tareas" y "Tokens MCP", y "Cerrar sesión" cuando hay sesión. Las acciones y enlaces interactivos visibles del header SHALL ofrecer un área táctil mínima de 44 × 44 píxeles CSS. El titular del día de la página de tareas SHALL quedar debajo de la navbar.

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
- **WHEN** el usuario navega entre "/" y "/tareas"
- **THEN** la navbar mantiene estructura, marca y acciones de sesión en ambas páginas

#### Scenario: Controles del header cómodos al tacto
- **WHEN** la navbar muestra acciones interactivas en cualquier ancho responsive
- **THEN** cada botón y enlace visible ofrece un área de interacción de al menos 44 × 44 píxeles CSS y conserva un indicador de foco visible
