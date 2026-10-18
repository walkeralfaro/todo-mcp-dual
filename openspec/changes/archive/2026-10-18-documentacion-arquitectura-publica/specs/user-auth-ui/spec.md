# Spec Delta

## ADDED Requirements

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
