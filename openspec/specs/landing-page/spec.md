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
La landing SHALL organizarse alrededor de una promesa principal clara y secciones breves que expliquen capacidades reales de la app con una prueba visual legible. La composición SHALL priorizar el contenido sobre los adornos y SHALL NOT inventar testimonios, clientes, logos, cifras de uso, precios ni duraciones de configuración.

#### Scenario: Secciones con prueba real
- **WHEN** una persona recorre la landing
- **THEN** puede identificar que la web y sus agentes MCP operan sobre la misma lista, y encuentra pruebas legibles de las capacidades descritas

#### Scenario: Sin prueba social inventada
- **WHEN** se revisa el contenido publicado
- **THEN** no aparecen testimonios, logos de terceros, cifras de uso, precios ni promesas de duración que no estén respaldados por una función verificable

#### Scenario: Fragmentos visuales legibles
- **WHEN** una sección muestra una parte de la interfaz o configuración
- **THEN** el texto relevante se lee completo, no queda tapado por pies o adornos y el fragmento no se recorta de forma que impida entenderlo

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
La landing SHALL funcionar a 390, 768 y 1440 px sin scroll horizontal ni contenido relevante recortado, con foco visible en todos los controles y contraste AA del texto sobre su fondo. Los titulares principales SHALL ocupar como máximo dos líneas en esos anchos. El movimiento SHALL limitarse a `transform`/`opacity` y suprimirse con `prefers-reduced-motion` manteniendo siempre el contenido visible.

#### Scenario: Sin desbordes en tres anchos
- **WHEN** se abre la landing a 390, 768 y 1440 px
- **THEN** no hay scroll horizontal, los fragmentos y textos relevantes se ven completos y los titulares principales no superan dos líneas

#### Scenario: Movimiento reducido
- **WHEN** la persona tiene `prefers-reduced-motion` activado
- **THEN** las entradas y transiciones no desplazan contenido y todo permanece visible y usable

#### Scenario: Navegación por teclado
- **WHEN** la persona recorre la landing solo con teclado
- **THEN** cada enlace y botón muestra foco visible y la demo permite añadir y marcar tareas

### Requirement: Guía MCP con pasos verificables
La landing SHALL explicar la conexión de un agente MCP mediante pasos numerados que correspondan a acciones disponibles en el producto, sin asociarles duraciones no verificadas.

#### Scenario: Pasos de conexión comprensibles
- **WHEN** una persona consulta la guía MCP
- **THEN** puede reconocer que necesita una cuenta, crear un token y configurar su cliente con el endpoint y la cabecera Bearer

#### Scenario: Pasos sin tiempos prometidos
- **WHEN** se presenta el orden de conexión
- **THEN** los pasos se identifican por su orden y acciones, sin estimaciones de duración

### Requirement: Enlace a la documentación de arquitectura en la landing
La landing SHALL ofrecer un enlace visible a la documentación de arquitectura (`/arquitectura`) para visitantes anónimos y con sesión, alcanzable a 390, 768 y 1440 px. El enlace SHALL ser secundario: no SHALL contarse como llamada a la acción principal ni SHALL añadir una segunda acción primaria por pantalla, y SHALL abrirse en una pestaña nueva.

#### Scenario: Visitante anónimo encuentra la documentación
- **WHEN** un visitante sin sesión recorre la landing a 390, 768 o 1440 px
- **THEN** encuentra un enlace visible a `/arquitectura` y al activarlo se abre la documentación en una pestaña nueva

#### Scenario: La jerarquía de acciones se conserva
- **WHEN** se revisa la primera pantalla de la landing
- **THEN** sigue existiendo una sola acción principal de acceso y el enlace a la documentación no compite con ella

#### Scenario: Sin desbordes al añadir el enlace
- **WHEN** la landing se abre a 390, 768 y 1440 px con el enlace publicado
- **THEN** no aparece scroll horizontal ni ningún contenido relevante queda recortado
