# Spec Delta: user-auth-ui

## ADDED Requirements

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
