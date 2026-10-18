# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Guía MCP con pasos verificables
La landing SHALL explicar la conexión de un agente MCP mediante pasos numerados que correspondan a acciones disponibles en el producto, sin asociarles duraciones no verificadas.

#### Scenario: Pasos de conexión comprensibles
- **WHEN** una persona consulta la guía MCP
- **THEN** puede reconocer que necesita una cuenta, crear un token y configurar su cliente con el endpoint y la cabecera Bearer

#### Scenario: Pasos sin tiempos prometidos
- **WHEN** se presenta el orden de conexión
- **THEN** los pasos se identifican por su orden y acciones, sin estimaciones de duración
