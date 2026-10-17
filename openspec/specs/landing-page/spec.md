# landing-page Specification

## Purpose

Presenta el producto al público anónimo en la raíz del sitio: qué es la app de tareas con MCP, una demostración real de su comportamiento y el acceso a la cuenta, sin exponer datos de ningún usuario.

## Requirements

### Requirement: Página pública de presentación en la raíz
El sistema SHALL renderizar la landing en `/` para visitantes anónimos sin mostrar tareas ni datos de ningún usuario. Con sesión activa, la misma página SHALL seguir siendo accesible y sus llamadas a la acción SHALL dirigir a la app (`/tareas`) en lugar de abrir el modal de acceso.

#### Scenario: Visitante anónimo abre la raíz
- **WHEN** un visitante sin sesión solicita `/`
- **THEN** recibe la landing con navbar, contenido de presentación y acciones de acceso, y la respuesta no incluye tareas ni datos de usuario

#### Scenario: Usuario con sesión abre la raíz
- **WHEN** un usuario autenticado solicita `/`
- **THEN** ve la landing con acciones que enlazan a `/tareas` y `/mcp`, sin modal de acceso abierto

### Requirement: Argumento verificable sección a sección
La landing SHALL organizar su contenido como afirmaciones del producto con su prueba visible (fragmentos reales de la interfaz de la app construidos sobre el mismo sistema de diseño) y en español. La landing SHALL NOT inventar testimonios, clientes, logos, cifras de uso ni precios.

#### Scenario: Secciones con prueba real
- **WHEN** el visitante recorre la landing de arriba a abajo
- **THEN** cada sección comunica una capacidad real (captura de tareas, estados y filtros, uso por agentes vía MCP, aislamiento por cuenta) acompañada de un fragmento real de la interfaz o de la configuración del producto

#### Scenario: Sin prueba social inventada
- **WHEN** se revisa el contenido publicado
- **THEN** no existen testimonios, logos de terceros, cifras de uso ni precios que no provengan de funcionalidad verificable

### Requirement: Interacción viva del producto
La landing SHALL incluir una interacción principal construida con el producto: una demo local de captura y marcado de tarea que funciona sin sesión y sin persistir en el servidor, con fallback legible sin JavaScript. Además SHALL ofrecer un bloque copiable de configuración para clientes MCP.

#### Scenario: Demo local de tarea
- **WHEN** un visitante escribe una tarea en la demo de la landing
- **THEN** la ve aparecer en una lista local con su estado y puede marcarla o desmarcarla, sin llamadas al servidor y sin afectar datos reales

#### Scenario: Fallback sin JavaScript
- **WHEN** el visitante navega con JavaScript deshabilitado
- **THEN** el argumento de la landing sigue legible y la demo muestra una versión estática comprensible

#### Scenario: Configuración MCP copiable
- **WHEN** el visitante activa copiar en el bloque de configuración MCP
- **THEN** el texto (URL del endpoint y formato de la cabecera `Authorization: Bearer <token>`) queda en el portapapeles con confirmación visible

### Requirement: Llamada a la acción de acceso
La landing SHALL exponer una acción primaria de acceso en la primera pantalla — "Iniciar sesión" o "Crear cuenta" para visitantes anónimos, "Ir a mis tareas" para usuarios con sesión — y SHALL NOT incluir más de una acción primaria por pantalla.

#### Scenario: CTA abre el modal en la pestaña correcta
- **WHEN** el visitante anónimo activa "Iniciar sesión" o "Crear cuenta" en la landing
- **THEN** se abre el modal de cuenta existente en la pestaña correspondiente

#### Scenario: CTA con sesión navega a la app
- **WHEN** un usuario autenticado activa la acción primaria de la landing
- **THEN** navega a `/tareas`

### Requirement: Accesibilidad y comportamiento responsive de la landing
La landing SHALL funcionar a 390, 768 y 1440 px sin scroll horizontal, con foco visible en todos los controles, contraste AA del texto sobre su fondo y titulares de dos líneas como máximo en todo ancho. El movimiento SHALL limitarse a `transform`/`opacity` y suprimirse con `prefers-reduced-motion` manteniendo siempre el contenido visible.

#### Scenario: Sin desbordes en tres anchos
- **WHEN** se abre la landing a 390, 768 y 1440 px
- **THEN** no hay scroll horizontal, ningún elemento queda recortado y los titulares no superan dos líneas

#### Scenario: Movimiento reducido
- **WHEN** el visitante tiene `prefers-reduced-motion` activado
- **THEN** las entradas y transiciones no desplazan contenido y todo permanece visible y usable

#### Scenario: Navegación por teclado
- **WHEN** el visitante recorre la landing solo con teclado
- **THEN** cada enlace y botón muestra foco visible y la demo es operable (añadir y marcar tareas)
