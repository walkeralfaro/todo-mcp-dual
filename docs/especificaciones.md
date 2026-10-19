<!-- GENERADO por scripts/sync-especificaciones.mjs: no editar a mano. -->

# Especificaciones de la Todo App

Índice legible de todas las capacidades del proyecto. La fuente de verdad es
una carpeta por capacidad (`openspec/specs/<capacidad>/spec.md`); este
documento se regenera con `npm run specs:doc` (también corre en `predev` y
`prebuild`), así que no debe editarse a mano.

- Capacidades: 6
- Requisitos: 61
- Escenarios: 180

## Índice

| # | Capacidad | Requisitos | Escenarios |
| --- | --- | --- | --- |
| 1 | [identity](#1-identity) | 12 | 46 |
| 2 | [mcp](#2-mcp) | 10 | 34 |
| 3 | [platform](#3-platform) | 6 | 10 |
| 4 | [public-site](#4-public-site) | 11 | 33 |
| 5 | [task-ui](#5-task-ui) | 17 | 43 |
| 6 | [todo-tasks](#6-todo-tasks) | 5 | 14 |

---

## 1. identity

**Propósito.** Autentica usuarios con email y contraseña o Google, mantiene su sesión entre solicitudes, protege las rutas privadas y presenta las acciones de sesión y de cuenta en la navbar compartida.

### Requirement: Autenticación de usuario con email y contraseña
El sistema SHALL permitir a un usuario registrarse e iniciar sesión con email y contraseña, creando una sesión de usuario autenticada. La contraseña de registro SHALL tener una longitud mínima de 8 caracteres y los rechazos de registro e inicio de sesión SHALL comunicarse con mensajes claros en español.

#### Scenario: Usuario se registra con email y contraseña
- **WHEN** un usuario proporciona email y contraseña válidos (longitud mínima de 8)
- **THEN** se crea una cuenta de usuario y se inicia una sesión autenticada

#### Scenario: Contraseña incorrecta rechaza el acceso
- **WHEN** un usuario intenta iniciar sesión con contraseña incorrecta
- **THEN** el sistema rechaza la autenticación con un error en español

#### Scenario: Contraseña demasiado corta rechaza el registro
- **WHEN** un usuario intenta registrarse con una contraseña de menos de 8 caracteres
- **THEN** el sistema rechaza el registro con un mensaje en español que indica la longitud mínima exigida

#### Scenario: Registro con correo ya existente rechaza
- **WHEN** un usuario intenta registrarse con un correo que ya tiene cuenta
- **THEN** el sistema rechaza el registro con un mensaje de error en español

### Requirement: Inicio de sesión con Google OAuth
El sistema SHALL permitir a un usuario autenticarse mediante Google OAuth, vinculando su cuenta de Google a una cuenta de usuario de la Todo App.

#### Scenario: Usuario se autentica con Google OAuth
- **WHEN** un usuario elige iniciar sesión con Google y completa el flujo de OAuth
- **THEN** se vincula su cuenta de Google y se inicia una sesión autenticada

### Requirement: Gestión de sesiones de usuario
El sistema SHALL mantener una sesión de usuario autenticada entre solicitudes y permitir cerrar la sesión. Cada solicitud del navegador (render del servidor y Server Actions) SHALL resolver la sesión a partir de las cookies de esa solicitud, sin dependencias de estado del cliente ni recargas manuales.

#### Scenario: Sesión persiste entre solicitudes
- **WHEN** un usuario ha iniciado sesión y realiza una solicitud posterior
- **THEN** el sistema reconoce al usuario autenticado sin requerir nuevo login

#### Scenario: El servidor resuelve la sesión desde las cookies de la solicitud
- **WHEN** un usuario con cookie de sesión válida solicita la página principal o invoca una Server Action
- **THEN** el render del servidor y la acción resuelven la sesión desde las cookies de la solicitud y aplican sus reglas de autenticación, sin requerir una nueva autenticación ni una recarga manual

#### Scenario: Usuario cierra sesión
- **WHEN** un usuario autenticado cierra sesión
- **THEN** la sesión se invalida y el usuario ya no está autenticado

### Requirement: Rutas protegidas de la aplicación
El sistema SHALL exigir sesión autenticada para `/tareas` y `/mcp`, redirigiendo al visitante anónimo a la landing con el modal de acceso abierto en la pestaña de inicio de sesión y el parámetro `next` con la ruta solicitada (`/?auth=login&next=<ruta>`). La protección SHALL aplicarse antes de renderizar contenido protegido y SHALL NOT depender de ocultar componentes dentro de la página.

#### Scenario: Deep link a tareas sin sesión
- **WHEN** un visitante sin sesión solicita `/tareas`
- **THEN** es redirigido a `/?auth=login&next=/tareas` con el modal de acceso abierto

#### Scenario: Deep link a tokens sin sesión
- **WHEN** un visitante sin sesión solicita `/mcp`
- **THEN** es redirigido a `/?auth=login&next=/mcp` con el modal de acceso abierto

#### Scenario: Cookie inválida no accede
- **WHEN** una solicitud llega a `/tareas` con cookie de sesión caducada o inválida
- **THEN** el sistema no renderiza contenido protegido y redirige a la landing con el modal de acceso abierto

#### Scenario: Con sesión se accede
- **WHEN** un usuario autenticado solicita `/tareas` o `/mcp`
- **THEN** el sistema renderiza la página protegida correspondiente

### Requirement: Acceso dirigido y retorno tras autenticarse
La landing SHALL interpretar los parámetros `auth` y `next` para abrir el modal de cuenta en la pestaña solicitada. Tras una autenticación exitosa (email/contraseña o Google), el sistema SHALL navegar a `next` cuando sea una ruta local válida (comienza por `/` y no por `//`) y a `/tareas` en caso contrario.

#### Scenario: Retorno a la ruta solicitada
- **WHEN** el usuario llega desde `/?auth=login&next=/mcp` e inicia sesión con éxito
- **THEN** el navegador navega a `/mcp`

#### Scenario: Pestaña solicitada respetada
- **WHEN** el usuario abre `/?auth=register`
- **THEN** el modal aparece en la pestaña "Registrarse"

#### Scenario: Next inválido se ignora
- **WHEN** el parámetro `next` no es una ruta local válida (por ejemplo `https://ejemplo.com` o `//evil`)
- **THEN** tras autenticarse se navega a `/tareas`

#### Scenario: Google respeta el retorno
- **WHEN** el usuario completa el flujo de Google iniciado desde un redirect de protección
- **THEN** vuelve a la ruta `next` solicitada

### Requirement: Modal único de cuenta con pestañas login y registro
El sistema SHALL mostrar un único modal (Dialog) con dos pestañas, "Iniciar sesión" y "Registrarse", para autenticar al usuario con email y contraseña. El modal SHALL conservar los valores tecleados al cambiar de pestaña o tras un envío fallido y SHALL mostrar un único mensaje de error dentro del modal cuando la autenticación es rechazada.

#### Scenario: Abrir modal de cuenta
- **WHEN** el usuario hace clic en "Iniciar sesión" o "Registrarse" en el header
- **THEN** se abre el modal con la pestaña correspondiente seleccionada y el foco en el primer campo

#### Scenario: Cambiar entre pestañas
- **WHEN** el usuario hace clic en la pestaña "Registrarse" estando en "Iniciar sesión"
- **THEN** el modal muestra el formulario de registro y viceversa, conservando lo tecleado

#### Scenario: Cerrar modal
- **WHEN** el usuario pulsa Escape o hace clic fuera del modal
- **THEN** el modal se cierra y vuelve a la página principal

#### Scenario: Mostrar error sin cerrar el modal
- **WHEN** el servidor rechaza el registro o el inicio de sesión (credenciales inválidas, contraseña corta, correo ya registrado, error del servidor)
- **THEN** el modal permanece abierto, conserva los valores tecleados y muestra un único mensaje de error en español; si el envío tiene éxito o falla, el estado pendiente se desactiva

### Requirement: Inicio de sesión con Google en el modal
El sistema SHALL ofrecer en el modal de cuenta un botón "Continuar con Google" que inicia el flujo de OAuth de Google, junto a las pestañas de email y contraseña.

#### Scenario: Botón de Google abre el flujo OAuth
- **WHEN** el usuario hace clic en "Continuar con Google" en el modal de cuenta
- **THEN** el navegador se redirige al flujo de OAuth de Google para completar la autenticación

### Requirement: Navbar compartida con acciones de sesión
El sistema SHALL mostrar una navbar compartida en la landing y en la página de tareas, con la marca, los enlaces de navegación y las acciones de sesión: "Iniciar sesión" y "Registrarse" cuando no hay sesión (abriendo el modal de cuenta); y, cuando hay sesión, el avatar del usuario, el enlace "Mis tareas" y un menú de usuario que contiene "Tokens MCP" y "Cerrar sesión". El titular del día de la página de tareas SHALL quedar debajo de la navbar.

#### Scenario: Header sin sesión muestra botones de entrada
- **WHEN** no hay sesión de usuario autenticada
- **THEN** la navbar muestra los botones "Iniciar sesión" y "Registrarse"

#### Scenario: Header con sesión muestra avatar y cerrar sesión
- **WHEN** hay una sesión de usuario autenticada
- **THEN** la navbar muestra el avatar del usuario (imagen de Google si se autenticó con OAuth, avatar genérico si es email) y el enlace "Mis tareas", mientras que "Tokens MCP" y "Cerrar sesión" quedan disponibles desde el menú de usuario

#### Scenario: Cerrar sesión
- **WHEN** el usuario activa "Cerrar sesión" desde el menú de usuario o desde el panel móvil
- **THEN** la sesión se invalida y el navegador vuelve a la landing en estado anónimo

#### Scenario: Inicio y cierre de sesión actualizan la vista server-rendered
- **WHEN** un usuario se autentica con éxito o cierra sesión
- **THEN** la vista server-rendered (navbar, formulario de creación, listado y titular del día) se refleja sin recarga manual del navegador

#### Scenario: Misma navbar en landing y app
- **WHEN** el usuario navega entre `/` y `/tareas`
- **THEN** la navbar mantiene estructura, marca y acciones de sesión en ambas páginas

### Requirement: Controles del header accesibles en todo ancho
Las acciones y enlaces interactivos visibles del header SHALL ofrecer un área táctil mínima de 44 × 44 píxeles CSS y SHALL ser alcanzables en todos los anchos responsivos, incluido móvil (<640px), sin depender de un ancho mínimo de pantalla.

#### Scenario: Controles del header cómodos al tacto
- **WHEN** la navbar muestra acciones interactivas en cualquier ancho responsive
- **THEN** cada botón y enlace visible ofrece un área de interacción de al menos 44 × 44 píxeles CSS y conserva un indicador de foco visible

#### Scenario: Enlaces de sesión alcanzables en móvil
- **WHEN** un usuario autenticado abre la app a 390px de ancho
- **THEN** puede alcanzar desde la navbar los enlaces "Mis tareas" y "Tokens MCP" (visibles o tras desplegar una navegación móvil accesible), además de "Cerrar sesión", sin que ningún control quede oculto ni recortado

### Requirement: Acciones de tareas reservadas a usuarios autenticados
El sistema SHALL permitir crear, editar y eliminar tareas únicamente cuando exista una sesión de usuario autenticada. El formulario de creación SHALL estar siempre presente para el usuario autenticado en `/tareas` y nunca ocultarse condicionalmente dentro de la página.

#### Scenario: Formulario de creación sin sesión
- **WHEN** no hay sesión de usuario autenticada
- **THEN** el sistema no muestra ningún formulario de creación: no existe acceso a la página de tareas y el visitante es redirigido a la landing con el modal de acceso abierto

#### Scenario: Formulario siempre presente con sesión
- **WHEN** un usuario autenticado abre `/tareas`
- **THEN** el formulario de creación está visible y operativo, junto con filtros, listado y titular del día

#### Scenario: Crear tarea con sesión
- **WHEN** hay una sesión de usuario autenticada y el usuario envía el formulario de creación
- **THEN** la tarea se crea asociada al usuario autenticado y aparece en su listado

#### Scenario: Lista de tareas por usuario
- **WHEN** hay una sesión de usuario autenticada
- **THEN** el listado muestra solo las tareas de ese usuario y el titular del día refleja sus pendientes

### Requirement: Menú de usuario en el header de escritorio
En escritorio (≥640 px) y con sesión, la barra SHALL mostrar un botón de usuario con el avatar, el primer nombre del usuario recortado a un máximo de 10 caracteres y un indicador de despliegue. Al activarlo SHALL desplegar un menú con exactamente dos acciones: "Tokens MCP" y "Cerrar sesión". El menú SHALL cerrarse con Escape devolviendo el foco al botón y con un clic fuera, SHALL NOT existir en móvil (<640 px) y sus ítems SHALL ofrecer al menos 44 × 44 px CSS con foco visible.

#### Scenario: Disparador con avatar y nombre recortado
- **WHEN** un usuario autenticado llamado "Christopher Alexander" abre la app a 1024 px de ancho
- **THEN** la barra muestra su avatar y el nombre recortado a 10 caracteres, y no muestra "Tokens MCP" ni "Cerrar sesión" sueltos

#### Scenario: Contenido del menú de usuario
- **WHEN** el usuario activa el botón de usuario
- **THEN** el menú muestra "Tokens MCP" y "Cerrar sesión", y ninguna otra acción de cuenta

#### Scenario: Navegar a tokens desde el menú
- **WHEN** el usuario activa "Tokens MCP" en el menú
- **THEN** el navegador navega a `/mcp` y el menú se cierra

#### Scenario: Cerrar sesión desde el menú de usuario
- **WHEN** el usuario activa "Cerrar sesión" en el menú
- **THEN** la sesión se invalida y el navegador vuelve a la landing en estado anónimo

#### Scenario: Escape cierra el menú y devuelve el foco
- **WHEN** el menú está abierto y el usuario pulsa Escape
- **THEN** el menú se cierra y el foco vuelve al botón de usuario

#### Scenario: Clic fuera cierra el menú
- **WHEN** el menú está abierto y el usuario hace clic fuera de él
- **THEN** el menú se cierra

#### Scenario: Área táctil y foco visible de los ítems
- **WHEN** el menú está abierto
- **THEN** "Tokens MCP" y "Cerrar sesión" ofrecen un área de interacción de al menos 44 × 44 px CSS y un indicador de foco visible

#### Scenario: Error de cierre de sesión dentro del menú
- **WHEN** el cierre de sesión iniciado desde el menú de usuario falla
- **THEN** el menú permanece abierto y muestra un único mensaje de error en español, sin cerrar la sesión

#### Scenario: En móvil no existe el menú de usuario
- **WHEN** un usuario autenticado abre la app a 390 px de ancho
- **THEN** el botón de usuario de escritorio no está presente y las acciones siguen disponibles en el panel móvil

### Requirement: Acciones de sesión en la barra móvil con sesión
Con sesión y ancho inferior a 640 px, la barra SHALL mostrar el avatar del usuario y, a su derecha, el botón que abre el panel de navegación móvil. La acción "Cerrar sesión" SHALL residir dentro de ese panel, no en la barra, y SHALL conservar un área táctil de al menos 44 × 44 px CSS, foco visible y el mismo comportamiento de invalidar la sesión y volver a la landing anónima. A partir de 640 px el cierre de sesión SHALL residir en el menú de usuario de escritorio, no suelto en la barra.

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
- **THEN** "Cerrar sesión" no está suelto en la barra y sigue siendo alcanzable desde el menú de usuario anclado a ella, de modo que el panel móvil no es la única vía de acceso

---

## 2. mcp

**Propósito.** Expone las tareas a agentes IA externos mediante el servidor MCP en `/api/mcp`, con cinco herramientas CRUD validadas sobre la misma base de datos que la UI, y gestiona las credenciales (tokens) con las que esos agentes se autentican.

### Requirement: Endpoint MCP Streamable HTTP con autenticación Bearer
El sistema SHALL exponer el servidor MCP en la ruta `/api/mcp` mediante Streamable HTTP, exigiendo autenticación mediante un token de acceso válido en la cabecera `Authorization` que resuelva a un `userId` mediante `McpToken`. El `userId` con el que opera cada tool SHALL provenir exclusivamente del token: cualquier `userId` presente en el cuerpo JSON-RPC o en los `arguments` de la invocación SHALL ignorarse.

#### Scenario: Descubrimiento de herramientas requiere autenticación
- **WHEN** un cliente MCP inicia sesión contra `/api/mcp` sin cabecera `Authorization` o con token inválido
- **THEN** el sistema rechaza la solicitud con error de autenticación

#### Scenario: Descubrimiento de herramientas con token válido
- **WHEN** un cliente MCP inicia sesión contra `/api/mcp` con `Authorization: Bearer <token>` válido
- **THEN** descubre las 5 herramientas de tareas asociadas al `userId` del token

#### Scenario: Invocación de tools con token válido
- **WHEN** un cliente MCP invoca `create_task` con título válido y token válido
- **THEN** la tool se ejecuta sobre el `userId` del token y responde con la tarea creada, sin error de autenticación

#### Scenario: Invocación de tools sin token válido
- **WHEN** un cliente MCP invoca cualquier tool sin cabecera `Authorization` o con token inválido
- **THEN** el sistema rechaza la invocación sin ejecutar la tool

#### Scenario: El usuario de la invocación sale del token, no del cuerpo
- **WHEN** un cliente MCP invoca `create_task` con token válido y añade el `userId` de otro usuario en los `arguments`
- **THEN** la tarea queda asociada al `userId` del token y no se crea ni modifica nada del usuario indicado en el cuerpo

### Requirement: Tool list_tasks con guardrails y aislamiento por usuario
La tool `list_tasks` SHALL aceptar `estado`, `q`, `limit` (default 50, max 100) y `offset` (default 0), devolviendo tareas en JSON dentro de `content[0].text` ordenadas por fechaCreacion desc, filtradas por el `userId` resuelto del token de autenticación.

#### Scenario: Listado por defecto limitado
- **WHEN** se invoca `list_tasks` sin parámetros con token válido
- **THEN** devuelve hasta 50 tareas del usuario autenticado ordenadas de más reciente a más antigua

#### Scenario: Límite excesivo recortado o rechazado
- **WHEN** se invoca `list_tasks` con limit 500 con token válido
- **THEN** el sistema aplica el tope de 100 o devuelve error de validación en español

#### Scenario: Listado no expone tareas de otros usuarios
- **WHEN** se invoca `list_tasks` con token válido de un usuario
- **THEN** solo se devuelven tareas asociadas al `userId` de ese usuario

### Requirement: Tools get/create/update/delete con aislamiento y autenticación
El sistema SHALL proveer `get_task`, `create_task`, `update_task` (parcial: titulo/descripcion/estado) y `delete_task` con la misma validación y reglas de fechaCulminada que la UI, resueltas al `userId` del token de autenticación y aisladas por usuario. En `create_task`, si `descripcion` se omite, el sistema SHALL persistir `null` sin inferir ni duplicar `titulo`; solo envía `descripcion` cuando el usuario la da explícitamente o pide duplicar.

#### Scenario: Crear vía MCP visible en UI del mismo usuario
- **WHEN** un agente invoca `create_task` con título válido y token válido
- **THEN** la tarea queda persistida asociada al `userId` del token y aparece en el listado web de ese usuario

#### Scenario: Crear solo con título no inventa descripción
- **WHEN** un agente invoca `create_task` solo con `titulo` y token válido
- **THEN** la tarea queda con `descripcion` nula y `get_task` la devuelve como nula

#### Scenario: Crear con descripción explícita la conserva
- **WHEN** un agente invoca `create_task` con `titulo` y `descripcion` explícita y token válido
- **THEN** ambas quedan persistidas tal cual

#### Scenario: Actualizar estado vía MCP
- **WHEN** un agente invoca `update_task` con estado COMPLETADA y token válido
- **THEN** fechaCulminada se asigna y la UI muestra la tarea como completada para ese usuario

#### Scenario: Recurso inexistente
- **WHEN** se invoca `get_task`, `update_task` o `delete_task` con id desconocido y token válido
- **THEN** responde error controlado indicando que la tarea no existe

#### Scenario: Acceso a tarea de otro usuario rechazado
- **WHEN** un agente invoca `get_task`, `update_task` o `delete_task` con id de una tarea asociada a otro `userId`
- **THEN** el sistema rechaza la operación con error de autorización

### Requirement: Formato y validación de respuestas MCP
Todas las tools SHALL validar parámetros con Zod (mensajes en español) y responder `{ content: [{ type: 'text', text: '<JSON>' }] }`; los errores de validación se devuelven como texto de error controlado, no como excepción sin formato. La validación y sus mensajes SHALL vivir en `lib/validators.ts`: los esquemas que publica `tools/list` describen tipos y dejan los límites en su descripción, sin repetir las reglas de negocio con textos en otro idioma.

#### Scenario: Parámetro inválido
- **WHEN** se invoca `create_task` con título vacío y token válido
- **THEN** la respuesta es un error en español sin crear la tarea

#### Scenario: Título por encima del máximo
- **WHEN** se invoca `create_task` con un título de 101 caracteres y token válido
- **THEN** la respuesta en español indica el máximo de 100 caracteres y no se crea la tarea

#### Scenario: Error de autenticación
- **WHEN** se invoca cualquier tool MCP sin token válido
- **THEN** la respuesta es un error de autenticación en español

### Requirement: Consistencia de estado UI-MCP
Toda mutación por MCP SHALL ser visible de inmediato en la UI (misma base de datos) y viceversa, sin stores duplicados, dentro del ámbito del usuario autenticado.

#### Scenario: Ida y vuelta
- **WHEN** la UI crea una tarea y el agente la completa vía MCP con token del mismo usuario
- **THEN** la UI muestra la tarea completada tras refrescar y `get_task` devuelve COMPLETADA con fechaCulminada

### Requirement: Generación de token con visualización única
El sistema SHALL generar, para el usuario autenticado, un token de acceso MCP con al menos 256 bits de aleatoriedad y prefijo `tmcp_`, mostrando su valor en claro una única vez. El sistema SHALL persistir únicamente su hash SHA-256 y un prefijo visible (primeros 8 caracteres), SHALL NOT poder recuperar el valor en claro después, y SHALL asignarle una expiración por defecto de 90 días.

#### Scenario: Generar y copiar
- **WHEN** el usuario autenticado activa "Generar token" y confirma
- **THEN** el sistema muestra el token completo una sola vez, con opción de copiarlo y aviso de que no volverá a mostrarse

#### Scenario: El valor no se recupera
- **WHEN** el usuario cierra el diálogo de generación o recarga la página
- **THEN** el token en claro deja de estar disponible y solo se muestra su prefijo y metadatos

#### Scenario: Persistencia segura
- **WHEN** se inspecciona el registro almacenado del token generado
- **THEN** contiene el hash SHA-256 y el prefijo visible, nunca el valor en claro

#### Scenario: Expiración por defecto
- **WHEN** se genera un token sin fecha de expiración explícita
- **THEN** su expiración queda a 90 días desde su creación

### Requirement: Listado de tokens identificable y aislado
El sistema SHALL listar para el usuario autenticado únicamente sus propios tokens, mostrando prefijo visible, fecha de creación, último uso y expiración, sin exponer jamás el valor en claro ni tokens de otros usuarios.

#### Scenario: Listado propio
- **WHEN** el usuario autenticado abre `/mcp` con tokens generados
- **THEN** ve cada token con su prefijo (p. ej. `tmcp_ab12…`), fecha de creación, último uso y expiración

#### Scenario: Aislamiento entre usuarios
- **WHEN** un usuario autenticado abre `/mcp` y otro usuario tiene tokens
- **THEN** solo aparecen los tokens del usuario autenticado

#### Scenario: Sin valor en claro en la lista
- **WHEN** se inspecciona la página o el estado de la lista de tokens
- **THEN** ningún token aparece completo; solo prefijo y metadatos

### Requirement: Revocación inmediata por el propietario
El sistema SHALL permitir al propietario revocar (eliminar) un token con confirmación previa; a partir de ese momento el token revocado SHALL ser rechazado por el servidor MCP. Un usuario SHALL NOT poder revocar tokens de otro usuario.

#### Scenario: Revocar con confirmación
- **WHEN** el usuario propietario confirma la revocación de un token
- **THEN** el token desaparece de la lista y el sistema lo reporta como revocado

#### Scenario: Token revocado rechazado por MCP
- **WHEN** un cliente MCP usa un token revocado en `Authorization: Bearer`
- **THEN** `/api/mcp` responde error de autenticación (401) sin ejecutar ninguna tool

#### Scenario: Revocación de tercero rechazada
- **WHEN** un usuario intenta revocar un token que no le pertenece
- **THEN** el sistema rechaza la operación y el token sigue activo

### Requirement: Uso del token generado contra el servidor MCP
Un token generado desde la interfaz SHALL autenticar solicitudes en `/api/mcp` como los existentes, resolviendo al `userId` de su propietario, actualizando su último uso y respetando la expiración; las operaciones SHALL quedar aisladas al usuario propietario.

#### Scenario: Token de la UI autentica tools
- **WHEN** un cliente MCP llama a `/api/mcp` con un token generado desde `/mcp`
- **THEN** las tools operan sobre las tareas del usuario propietario igual que con la UI web

#### Scenario: Último uso actualizado
- **WHEN** el token se usa al menos una vez contra `/api/mcp`
- **THEN** el listado muestra su último uso actualizado

#### Scenario: Token expirado rechazado
- **WHEN** un cliente MCP usa un token cuya expiración ya pasó
- **THEN** `/api/mcp` responde error de autenticación (401) aunque el registro siga existiendo

### Requirement: Instrucciones de conexión para clientes MCP
La página `/mcp` SHALL mostrar, solo a usuarios autenticados, las instrucciones para conectar un cliente MCP: URL del endpoint (`/api/mcp`), formato de la cabecera `Authorization: Bearer <token>` y un bloque de configuración de cliente copiable.

#### Scenario: Instrucciones visibles con sesión
- **WHEN** el usuario autenticado abre `/mcp`
- **THEN** ve la URL del endpoint, el formato de la cabecera y el bloque de configuración de cliente

#### Scenario: Copiar configuración
- **WHEN** el usuario activa copiar en el bloque de configuración
- **THEN** el contenido queda en el portapapeles con confirmación visible

#### Scenario: Sin sesión no hay instrucciones
- **WHEN** un visitante sin sesión solicita `/mcp`
- **THEN** es redirigido a la landing con el modal de acceso abierto y no ve instrucciones ni tokens

---

## 3. platform

**Propósito.** Permite ejecutar pruebas y producción contra Turso remoto con entornos separados (test vs prod), partiendo de esquema vacío y con aislamiento por limpieza de tablas.

### Requirement: Selección de cliente por entorno
El sistema SHALL usar el adapter libsql (`@libsql/client` + `@prisma/adapter-libsql`) cuando existan `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, y SQLite en archivo vía `DATABASE_URL` en caso contrario.

#### Scenario: Runtime usa Turso cuando hay credenciales
- **WHEN** `TURSO_DATABASE_URL` está definida al arrancar la app
- **THEN** toda lectura/escritura de tareas va a Turso y no a ningún archivo local

#### Scenario: Fallback local sin Turso
- **WHEN** no hay `TURSO_DATABASE_URL` definida
- **THEN** el sistema usa `DATABASE_URL` (por defecto `file:../dev.db`)

### Requirement: Esquema inicial vacío en Turso
El sistema SHALL crear la tabla `Task` en cada DB Turso aplicando el DDL generado por Prisma (`migrate diff --script`) con el cliente libsql, partiendo vacía y sin importar datos de `dev.db`.

#### Scenario: Push crea tabla vacía en test
- **WHEN** se aplica el DDL de Prisma contra la URL de test
- **THEN** la tabla `Task` existe y `list_tasks` devuelve lista vacía

### Requirement: Creación automática en deploy
El sistema SHALL garantizar el esquema en cada deploy ejecutando el DDL idempotente (`IF NOT EXISTS`) como parte del build cuando haya credenciales Turso, sin requerir pasos manuales.

#### Scenario: Deploy sin tabla la crea
- **WHEN** se despliega a Vercel contra una DB sin tabla `Task`
- **THEN** el build crea la tabla y la home responde 200 en vez de 500

#### Scenario: Build local sin Turso no se interrumpe
- **WHEN** se ejecuta el build sin `TURSO_DATABASE_URL` definida
- **THEN** el paso de esquema se omite con aviso y el build continúa igual que antes

### Requirement: Aislamiento de pruebas por limpieza de tablas
Cada test SHALL partir de un estado limpio mediante `DELETE FROM Task`, sin borrar ni recrear la base de datos.

#### Scenario: Tests no se contaminan entre sí
- **WHEN** un test crea tareas y termina
- **THEN** el siguiente test observa cero tareas previas

#### Scenario: Sin ficheros efímeros en remoto
- **WHEN** corre Vitest o Playwright contra Turso
- **THEN** no se ejecuta `rm -f *.db` ni se crean archivos SQLite locales para ese run

### Requirement: Separación test/prod
Ningún test SHALL conectarse a la DB de prod; Vitest, Playwright y dev local usan solo credenciales de test, y Vercel usa solo credenciales de prod.

#### Scenario: Suite verde no toca prod
- **WHEN** se ejecuta `npm test` y `npx playwright test` con credenciales de test
- **THEN** la DB de prod conserva íntegro su conteo de tareas

#### Scenario: Prod solo en Vercel
- **WHEN** la app corre desplegada en Vercel
- **THEN** usa exclusivamente su par URL/token de prod configurado en el dashboard

### Requirement: Secretos fuera del repo
Las URLs y tokens de Turso SHALL vivir en `.env` local (gitignored) y en variables de Vercel, nunca commiteados; `.env.example` solo documenta nombres sin valores reales.

#### Scenario: Repo sin secretos
- **WHEN** se inspecciona el repo commiteado
- **THEN** no aparece ningún `libsql://` ni token, y `.env.example` solo muestra placeholders

---

## 4. public-site

**Propósito.** Presenta el producto en la web pública —landing de la raíz, pie de página global y documentación de arquitectura— sin exponer tareas ni datos de ningún usuario.

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

### Requirement: Enlace a la documentación de arquitectura
El sistema SHALL ofrecer un enlace visible a la documentación de arquitectura (`/arquitectura`), abierto en pestaña nueva, desde la landing (visitantes anónimos y con sesión, a 390, 768 y 1440 px) y desde la navbar compartida (desde 640 px de ancho; por debajo, alcanzable desde el panel de navegación móvil con sesión o desde el pie de la landing en estado anónimo). El enlace SHALL ser secundario y no SHALL añadir una segunda acción primaria por pantalla.

#### Scenario: Visitante anónimo encuentra la documentación
- **WHEN** un visitante sin sesión recorre la landing a 390, 768 o 1440 px
- **THEN** encuentra un enlace visible a `/arquitectura` y al activarlo se abre la documentación en una pestaña nueva

#### Scenario: Enlace visible en la barra desde 640 px
- **WHEN** se abre cualquier página del sitio a 640 px o más de ancho
- **THEN** la barra muestra el enlace a la documentación y, al activarlo, la documentación se abre en una pestaña nueva

#### Scenario: Enlace alcanzable en móvil con sesión
- **WHEN** un usuario autenticado abre la app a 390 px de ancho
- **THEN** puede alcanzar el enlace a la documentación desde el panel de navegación móvil, junto a los enlaces de sesión, sin que ningún control quede oculto ni recortado

#### Scenario: Header anónimo en móvil sin recortes
- **WHEN** un visitante sin sesión abre la landing a 390 px de ancho
- **THEN** la barra mantiene la marca y las acciones de acceso sin desbordar, y la documentación sigue siendo alcanzable desde el pie de la landing

#### Scenario: La jerarquía de acciones se conserva
- **WHEN** se revisa la primera pantalla de la landing
- **THEN** sigue existiendo una sola acción principal de acceso y el enlace a la documentación no compite con ella

### Requirement: Presentación y accesibilidad del enlace de documentación
El enlace a la documentación SHALL distinguirse del resto de enlaces de la barra mediante el color de acento del sistema, con icono, área táctil de al menos 44 × 44 px CSS y foco visible. El orden de tabulación del header SHALL mantener la marca primero y las acciones de acceso antes que el enlace a la documentación.

#### Scenario: Área táctil y foco visible
- **WHEN** el enlace a la documentación es visible en la barra o en el panel móvil
- **THEN** ofrece un área de interacción de al menos 44 × 44 px CSS y un indicador de foco visible al navegar con teclado

#### Scenario: Enlace destacado visualmente
- **WHEN** el enlace a la documentación es visible en la barra de escritorio
- **THEN** se distingue del resto de enlaces de la barra mediante el color de acento del sistema y conserva el mismo texto, icono y área táctil

#### Scenario: El orden de tabulación no se altera
- **WHEN** un visitante anónimo recorre la cabecera solo con teclado
- **THEN** el primer elemento enfocable sigue siendo la marca y las acciones de acceso se alcanzan antes que el enlace a la documentación

### Requirement: Pie de página global con crédito al fondo
El sistema SHALL mostrar en todas las páginas del layout raíz (`/`, `/tareas` y `/mcp`) un pie con el texto "developed with ❤️ by walker alfaro". El pie SHALL participar del flujo normal dentro de la columna del layout, sin `position: fixed` ni `position: sticky`, de modo que quede anclado al borde inferior del viewport cuando el contenido sea más corto que la pantalla y, cuando haya scroll, aparezca al final del documento. El pie SHALL NOT superponerse al contenido ni al elemento con foco.

#### Scenario: Pie al fondo con contenido corto
- **WHEN** se abre una página cuyo contenido es más corto que el viewport
- **THEN** el pie queda en el borde inferior del viewport, totalmente visible y sin superponerse al contenido

#### Scenario: Pie al final del documento con contenido largo
- **WHEN** el contenido de la página supera la altura del viewport y el usuario hace scroll hasta el final
- **THEN** el pie aparece después de todo el contenido, al final del documento, y nunca cubre contenido mientras se desplaza

#### Scenario: Crédito presente en las tres páginas
- **WHEN** el usuario visita `/`, `/tareas` o `/mcp`
- **THEN** ve el texto "developed with ❤️ by walker alfaro" como único pie de la página

#### Scenario: El pie no tapa el foco
- **WHEN** el usuario navega por teclado hasta el último control antes del pie
- **THEN** el elemento enfocado queda totalmente visible y el pie no lo cubre

### Requirement: Documento de arquitectura publicado como recurso estático
El sistema SHALL servir el documento interactivo de arquitectura en la ruta pública `/arquitectura` como HTML, sin exigir sesión ni datos de ningún usuario, y SHALL mantenerlo accesible también en su ruta con extensión `/arquitectura.html`. La respuesta SHALL contener el documento de arquitectura vigente y no SHALL exponer tareas, correos ni credenciales.

#### Scenario: Visitante anónimo abre la documentación
- **WHEN** un visitante sin sesión solicita `/arquitectura`
- **THEN** recibe un `200` con `Content-Type` HTML que contiene el documento de arquitectura, sin redirección al modal de acceso y sin datos de ningún usuario

#### Scenario: Ruta con extensión sigue disponible
- **WHEN** se solicita `/arquitectura.html`
- **THEN** se sirve el mismo documento que en `/arquitectura`

#### Scenario: Documento autocontenido
- **WHEN** el documento se carga en el navegador sin red externa disponible
- **THEN** su contenido, sus diagramas y su conmutador de tema siguen funcionando porque no requiere scripts, hojas, fuentes ni imágenes de terceros

### Requirement: Publicación desde una fuente versionada y sincronizada
El sistema SHALL publicar el recurso a partir del documento de arquitectura versionado en `docs/`, mediante una copia idempotente hacia `public/` que se ejecuta antes de arrancar el entorno de desarrollo y antes de compilar. Si la fuente no está disponible, el paso de publicación SHALL NOT interrumpir el arranque ni la compilación, y SHALL dejar constancia en la salida.

#### Scenario: El recurso se publica al arrancar y al compilar
- **WHEN** se ejecuta el arranque en desarrollo o la compilación del proyecto
- **THEN** el archivo publicado en `public/` coincide con el documento versionado en `docs/`

#### Scenario: Copia idempotente
- **WHEN** el paso de publicación se ejecuta dos veces seguidas sin cambios en la fuente
- **THEN** el resultado es el mismo archivo y el paso termina correctamente

#### Scenario: Fuente ausente no rompe el build
- **WHEN** el documento versionado en `docs/` no existe
- **THEN** el arranque y la compilación continúan, la copia se omite y el paso informa de la omisión

---

## 5. task-ui

**Propósito.** Define la pantalla protegida `/tareas` —formulario de creación, listado, filtros, buscador y titular del día— y el sistema de componentes, tipografía, color y movimiento que comparten las pantallas de la aplicación.

### Requirement: La UI de tareas vive en /tareas
La interfaz de gestión de tareas (titular del día, formulario de creación, filtros, listado y footer) SHALL servirse en la ruta `/tareas`, protegida por sesión, sin cambios de comportamiento ni de layout respecto a la implementación actual.

#### Scenario: App completa en la ruta nueva
- **WHEN** un usuario autenticado abre `/tareas`
- **THEN** ve titular, formulario, filtros y listado operando igual que antes del cambio de ruta

#### Scenario: La raíz no sirve la app
- **WHEN** se solicita `/`
- **THEN** el sistema sirve la landing pública y no la interfaz de tareas

### Requirement: CRUD completo desde la UI
El sistema SHALL permitir desde la interfaz crear, editar título/descripción, cambiar estado mediante desplegable shadcn y eliminar tareas con diálogo de confirmación shadcn, reflejando cada cambio de inmediato en el listado, todo dentro del ámbito de tareas del usuario autenticado.

#### Scenario: Editar y cambiar estado
- **WHEN** el usuario edita el título y mueve la tarea a COMPLETADA desde el desplegable shadcn
- **THEN** el listado muestra los nuevos datos y la tarea aparece como completada

#### Scenario: Eliminar con confirmación
- **WHEN** el usuario confirma el borrado en el diálogo shadcn
- **THEN** la tarea desaparece del listado y ya no es recuperable por listado ni detalle

#### Scenario: Cancelar borrado no elimina
- **WHEN** el usuario abre el diálogo de borrado y activa Cancelar o pulsa Escape
- **THEN** el diálogo se cierra, el foco vuelve al botón Eliminar que lo abrió y la tarea sigue en el listado

#### Scenario: Usuario no puede editar tarea de otro usuario
- **WHEN** un usuario intenta editar o eliminar una tarea asociada a otro `userId`
- **THEN** el sistema rechaza la operación con error de autorización

### Requirement: Formulario de creación con errores anunciados
El formulario de creación SHALL exponer etiqueta visible por campo, asociar errores con `aria-describedby` + `aria-invalid`, anunciarlos con `role="alert"` y mantener los `data-testid` existentes. El envío SHALL mostrar estado pendiente con indicador accesible, sin deshabilitarse antes de iniciar la petición.

#### Scenario: Etiquetas y error anunciado al crear
- **WHEN** el usuario intenta crear una tarea con título vacío
- **THEN** el campo título queda marcado `aria-invalid="true"`, el mensaje en español aparece junto al campo con `role="alert"` y el foco se mueve al primer campo con error

#### Scenario: Estado pendiente accesible
- **WHEN** el usuario envía el formulario de creación
- **THEN** el botón muestra indicador de carga con texto "Creando…" y `aria-busy`, permanece deshabilitado solo durante la petición y conserva `data-testid="create-btn"`

### Requirement: Filtros y buscador accesibles
El filtro de estado SHALL presentarse como control segmentado con una sola opción activa (pastilla elevada distinguible, navegable por teclado) y la búsqueda SHALL presentarse como campo elevado distinguible de filtros y tareas, aplicar debounce (~300 ms), ofrecer botón para limpiar y anunciar el número de resultados con `aria-live="polite"`. El foco del buscador SHALL dibujarse íntegramente dentro de su caja (sin recortes por contenedores con scroll) y seguir siendo visible a teclado.

#### Scenario: Filtro como selección única accesible
- **WHEN** el usuario navega los filtros por teclado y elige PENDIENTE
- **THEN** solo PENDIENTE queda activo, el foco es visible y el estado se refleja en la URL (`?estado=PENDIENTE`)

#### Scenario: Búsqueda con debounce y anuncio
- **WHEN** el usuario escribe "inf" rápido en el buscador
- **THEN** el sistema espera ~300 ms tras la última tecla antes de filtrar y anuncia "N tareas encontradas" vía `aria-live`

#### Scenario: Limpiar búsqueda
- **WHEN** el usuario activa el botón limpiar del buscador
- **THEN** el campo se vacía, el parámetro `q` se elimina de la URL y el foco vuelve al campo de búsqueda

#### Scenario: Jerarquía buscador, filtros y tareas
- **WHEN** el usuario visualiza la zona de filtros con tareas cargadas
- **THEN** el buscador se distingue como campo elevado, el filtro activo como pastilla seleccionada y las tareas como filas de contenido, sin que los tres compartan el mismo tratamiento plano

#### Scenario: Foco del buscador sin recortes
- **WHEN** el usuario enfoca el buscador con teclado en desktop y en móvil (390px)
- **THEN** el indicador de foco se muestra completo (izquierda, derecha, arriba y abajo) sin cortes por scroll ni contenedores, con contraste visible sobre la superficie del campo

### Requirement: Titular del día con cifra de pendientes
El sistema SHALL mostrar como único titular destacado el repaso del día con la cifra de tareas no completadas del usuario autenticado (p. ej. "Hoy quedan 3") a tamaño héroe (5–7vw), recalculada al completar o crear tareas. La cifra SHALL contar todas las tareas no completadas del usuario, con independencia del filtro de estado activo, de la búsqueda activa y del máximo de filas que muestre el listado.

#### Scenario: Cifra visible al cargar
- **WHEN** el usuario abre la página con 3 tareas PENDIENTE o EN_PROCESO asociadas a su `userId`
- **THEN** el titular muestra la cifra 3 junto al texto del día

#### Scenario: Cifra recalcula al completar
- **WHEN** el usuario mueve una tarea a COMPLETADA
- **THEN** el titular decrementa su cifra sin recarga manual

#### Scenario: Cifra independiente del filtro y la búsqueda
- **WHEN** el usuario tiene 3 tareas no completadas y activa el filtro COMPLETADA, o busca un texto que solo coincide con tareas completadas
- **THEN** el titular sigue mostrando la cifra 3, mientras el listado queda vacío o solo con las coincidencias

#### Scenario: Cifra no limitada por la ventana del listado
- **WHEN** el usuario tiene más tareas no completadas que el máximo de filas que muestra el listado
- **THEN** el titular muestra el total real de no completadas y no el número de filas visibles

### Requirement: Pulso neón al descontar una tarea
El sistema SHALL acompañar el cambio de la cifra del titular con un pulso visible al descontar, sin recarga manual: la cifra en neón emite un pulso breve (solo `opacity`/`transform`, ≤300ms) y queda legible en su valor final.

#### Scenario: Pulso neón al descontar
- **WHEN** el usuario completa una tarea y la cifra del titular cambia
- **THEN** la cifra emite un pulso breve (solo `opacity`/`transform`, ≤300ms) en neón y queda legible en su valor final

### Requirement: Listado de tareas como tarjetas elevadas
Cada tarea del listado SHALL presentarse como tarjeta elevada (`bg-elevated` con borde sutil y radio) que contiene título en tinta plena, descripción opcional, estado/fecha a tamaño secundario y su bloque de acciones (desplegable de estado, Editar/Guardar, Eliminar). El título y la descripción SHALL tolerar texto largo sin romper el layout (`break-words`) y la fecha SHALL formatearse con `Intl.DateTimeFormat` en español.

#### Scenario: Fila muestra título y estado
- **WHEN** el listado contiene una tarea PENDIENTE con descripción
- **THEN** la tarjeta muestra título, descripción y el estado alineado al extremo derecho junto a sus acciones contenidas

#### Scenario: Tarjeta distinguible con y sin hover
- **WHEN** el usuario visualiza la lista sin interactuar
- **THEN** cada tarea ya se distingue del fondo por su superficie elevada, sin depender del hover

#### Scenario: Texto largo no rompe la tarjeta
- **WHEN** una tarea tiene un título o descripción con palabras muy largas
- **THEN** el texto se ajusta dentro de la tarjeta sin desbordar ni solapar el estado/fecha

#### Scenario: Grupos separados por espacio
- **WHEN** hay tareas en varios estados con el filtro TODAS
- **THEN** cada grupo empieza con su palabra de estado y espacio, sin líneas divisorias

### Requirement: Sistema sobrio de tipo y color con acento único
La UI SHALL usar tema oscuro "turno de noche" (fondo noche profunda, superficies por escalones de tono, sin degradados), Albert Sans (display semibold + texto regular/medium), cuerpo a 17–19px en tinta plena, y reservar el neón menta exclusivamente a la cifra viva del día, al botón primario y al estado COMPLETADA.

#### Scenario: Acento único
- **WHEN** se inspecciona la página con tareas en varios estados
- **THEN** el neón aparece solo en la cifra del día, la acción primaria y la marca de COMPLETADA, nunca en filtros ni textos secundarios

#### Scenario: Contraste de texto
- **WHEN** se mide el contraste del cuerpo y del neón sobre el fondo oscuro
- **THEN** el texto de cuerpo cumple AA y el neón cumple AA para texto o se usa solo en elementos grandes/no textuales

### Requirement: Jerarquía tipográfica y foco visible
El formulario y los filtros SHALL aplicar jerarquía (título de sección 18–20px semibold con `text-balance`, etiquetas 14px medium, ayuda/error 13–14px) y todo control interactivo SHALL mostrar foco visible de 2px con offset (anillo interior no recortable en el buscador) con contraste AA sobre cada superficie oscura.

#### Scenario: Jerarquía y foco visibles
- **WHEN** se inspeccionan el formulario de creación y los filtros
- **THEN** el título de sección es el texto de mayor peso/tamaño, las etiquetas son secundarias y cada control muestra anillo de foco de 2px al navegar por teclado sin usar `outline-none` sin reemplazo

#### Scenario: Contraste sobre superficies elevadas
- **WHEN** se mide el texto secundario sobre la card del formulario en tema oscuro
- **THEN** el ratio cumple AA (≥4.5:1) aunque el fondo de la card difiera del fondo de página

### Requirement: Superficies elevadas distinguibles del fondo
La card del formulario de creación y el menú del desplegable de estado SHALL distinguirse del fondo mediante superficie elevada (fondo más claro que `ground`, borde sutil y sombra), de modo que no se confundan con el fondo de página. El texto `muted` sobre superficies SHALL cumplir contraste AA (≥4.5:1).

#### Scenario: Card distinguible del fondo
- **WHEN** el usuario visualiza el formulario de creación junto al fondo de página
- **THEN** la card presenta borde y elevación propios y su perímetro es identificable sin depender solo del tono

#### Scenario: Muted legible sobre superficies
- **WHEN** se mide el contraste del texto secundario sobre la card y sobre el menú desplegable
- **THEN** el ratio es ≥4.5:1 en ambos casos

### Requirement: Desplegables y diálogos shadcn sin alerts nativos
El sistema SHALL implementar todo desplegable de la UI (incluido el cambio de estado por tarea) con el componente shadcn `Select` (Radix) accesible por teclado, y toda confirmación modal (incluido el borrado) con `Dialog` o `AlertDialog` shadcn con foco gestionado, cierre por Escape y botones explícitos. El sistema SHALL NOT usar `window.alert`, `window.confirm` ni `window.prompt`. Cada control shadcn SHALL conservar su `data-testid` y el anillo de foco visible de 2px.

#### Scenario: Cambio de estado con Select shadcn
- **WHEN** el usuario abre el desplegable de estado de una tarea por teclado y elige EN_PROCESO
- **THEN** el menú se abre/cierra con Enter/Escape, la opción queda seleccionada, el cambio persiste y el control conserva `data-testid="status-select"`

#### Scenario: Borrado con diálogo shadcn
- **WHEN** el usuario activa Eliminar en una tarea
- **THEN** se abre un diálogo con título, descripción y botones Cancelar/Eliminar, el foco entra al diálogo, Escape o Cancelar lo cierra sin borrar, y Confirmar elimina la tarea

#### Scenario: Ausencia de alerts nativos
- **WHEN** se ejecuta la suite E2E con diálogos nativos auto-descartados o espiando `window.confirm`
- **THEN** ningún flujo invoca `window.alert` ni `window.confirm` y todos los borrados pasan por el diálogo shadcn

### Requirement: Transiciones suaves con reduced-motion
El diálogo de confirmación y el desplegable de estado SHALL abrirse y cerrarse con transición visible (fundido + escala desde 0.95, ≤300ms, `ease-out` al entrar), y los botones y filas SHALL responder al hover/active solo con cambios de `transform`/`opacity`. Con `prefers-reduced-motion` el sistema SHALL suprimir el movimiento (fundido breve o sin animación) manteniendo el contenido y el foco.

#### Scenario: Diálogo entra con transición
- **WHEN** el usuario activa Eliminar en una tarea
- **THEN** el diálogo aparece con fundido y escala progresivos en lugar de mostrarse de golpe

#### Scenario: Movimiento reducido respetado
- **WHEN** el usuario opera con `prefers-reduced-motion` activado
- **THEN** abrir el diálogo o el desplegable no produce desplazamiento, escala ni zoom perceptibles y el foco sigue gestionado

### Requirement: Layout desktop a altura de viewport con tareas prioritarias
El sistema SHALL presentar en desktop (≥1024px) la app a la altura del viewport (`100dvh`) con la lista de tareas como región principal con scroll propio, manteniendo visibles el titular, el formulario de creación y los filtros sin desplazar las tareas fuera de pantalla. Las tareas SHALL ubicarse en la zona de mayor jerarquía visual y nunca debajo de un formulario de altura completa.

#### Scenario: Altura de viewport en desktop
- **WHEN** el usuario abre la app en un viewport desktop de 1440×900
- **THEN** el contenedor raíz mide la altura del viewport sin scroll de página global y solo la región de la lista hace scroll interno

#### Scenario: Tareas visibles sin scroll inicial
- **WHEN** existen al menos 3 tareas y el usuario carga la página en desktop
- **THEN** la primera tarea es visible sin desplazar la página y el formulario no ocupa más del 40% de la altura visible

### Requirement: Apilado y dianas táctiles en móvil
En móvil (<1024px) el sistema SHALL conservar el apilado vertical con formulario compacto, evitar el scroll horizontal y garantizar dianas táctiles de al menos 44px de alto en cada control de acción.

#### Scenario: Móvil conserva apilado compacto
- **WHEN** el usuario abre la app en un viewport de 390px de ancho
- **THEN** titular, formulario compacto, filtros y lista aparecen apilados y toda la página hace scroll como un único documento

#### Scenario: Sin overflow horizontal ni dianas pequeñas en móvil
- **WHEN** el usuario recorre la página en 390px
- **THEN** no hay scroll horizontal, cada botón/enlace de acción mide ≥44px de alto táctil y ningún control queda recortado o solapado

### Requirement: Botón shadcn reutilizable con variantes documentadas
El sistema SHALL proveer el botón de la app exclusivamente mediante `components/ui/button.tsx` (`buttonVariants` con cva) con variantes `default`, `secondary`, `outline`, `ghost` y `destructive` y tamaños `default`, `sm`, `lg`, `icon`, conservando la API (`variant`, `size`, `asChild`) y los tokens semánticos existentes.

#### Scenario: Reutilizar variantes sin estilos ad-hoc
- **WHEN** un desarrollador necesita un nuevo botón (p. ej. acción secundaria o destructiva)
- **THEN** puede componerlo solo con `variant`/`size` de `Button` sin escribir colores, radios ni focos manuales, y el resultado hereda foco visible, `disabled:opacity-50` y `active:scale`

#### Scenario: Destructivo consistente en diálogo y fila
- **WHEN** el usuario visualiza Eliminar en la tarjeta y Confirmar en el diálogo
- **THEN** ambos usan la variante `destructive` (sólida en confirmación, fantasma o texto en fila según diseño) con el mismo tono `destructive` y contraste AA sobre su superficie

#### Scenario: Acciones por tarea usan Button shadcn
- **WHEN** el usuario inspecciona Editar, Guardar y Eliminar en una tarjeta en desktop y en móvil (390px)
- **THEN** los tres comparten altura, radio, tipografía y anillo de foco del `Button` shadcn (solo cambia variante/color por intención), conservan `edit-btn`, `save-btn` y `delete-btn`, y son operables por teclado y táctil sin perder el foco visible

### Requirement: Flujos y selectores de test estables
El sistema SHALL conservar todos los flujos (crear, filtrar, buscar, editar, cambiar estado, eliminar con confirmación) y todos los `data-testid` existentes de la UI de tareas, que vive en la ruta protegida `/tareas`.

#### Scenario: Flujo completo conservado
- **WHEN** el usuario autenticado opera `/tareas`
- **THEN** los controles conservan los `data-testid` existentes (`new-title`, `create-btn`, `filter-*`, `edit-btn`, `save-btn`, `delete-btn`, `status-select`, entre otros)

### Requirement: Specs E2E apuntan a /tareas
Los specs E2E SHALL entrar por `/tareas` tras iniciar sesión y la suite `npx playwright test` SHALL quedar en verde conservando los flujos y selectores existentes.

#### Scenario: E2E en verde con la nueva entrada
- **WHEN** se ejecuta `npx playwright test` con los specs actualizados (`todo.spec.ts`, `todo-auth.spec.ts`)
- **THEN** los flujos completos entran por `/tareas` tras iniciar sesión y terminan en verde conservando sus `data-testid`

#### Scenario: E2E sin cambios de contrato
- **WHEN** se ejecuta `npx playwright test` sobre los flujos de tareas
- **THEN** el flujo completo (registro/login, crear, filtrar, buscar, editar, completar, borrar) termina en verde conservando sus `data-testid` sin cambios

---

## 6. todo-tasks

**Propósito.** Define el modelo de tarea, sus reglas de validación y de ciclo de vida, y la semántica de listado, filtrado y aislamiento por usuario que comparten la interfaz web y el servidor MCP.

### Requirement: Modelo Task persistente
El sistema SHALL persistir cada tarea con id único, titulo obligatorio, descripcion opcional, estado PENDIENTE/EN_PROCESO/COMPLETADA, fechaCreacion por defecto y fechaCulminada opcional, asociada a un usuario autenticado mediante `userId`. Si al crear no llega `descripcion` explícita, el sistema SHALL guardar `null` sin copiar `titulo`.

#### Scenario: Creación persiste todos los campos
- **WHEN** se crea una tarea con título y descripción como usuario autenticado
- **THEN** queda guardada con estado PENDIENTE, fechaCreacion asignada, fechaCulminada nula y asociada al `userId` del usuario

#### Scenario: Creación solo con título deja descripción nula
- **WHEN** se crea una tarea solo con `titulo` como usuario autenticado
- **THEN** queda guardada con `descripcion` nula, estado PENDIENTE, fechaCulminada nula y asociada al `userId` del usuario

#### Scenario: Estado por defecto
- **WHEN** se crea una tarea sin indicar estado como usuario autenticado
- **THEN** el sistema asigna PENDIENTE

#### Scenario: Tarea requiere usuario autenticado
- **WHEN** se intenta crear una tarea sin sesión de usuario autenticada
- **THEN** la operación falla con error de autenticación

### Requirement: Ciclo de vida de fechaCulminada
El sistema SHALL asignar fechaCulminada al entrar en COMPLETADA y limpiarla (null) al salir hacia PENDIENTE o EN_PROCESO; las transiciones entre los tres estados son libres.

#### Scenario: Completar asigna fecha
- **WHEN** una tarea pasa a COMPLETADA
- **THEN** fechaCulminada queda con la fecha-hora actual

#### Scenario: Reabrir limpia fecha
- **WHEN** una tarea COMPLETADA pasa a PENDIENTE o EN_PROCESO
- **THEN** fechaCulminada vuelve a null

### Requirement: Validación de entrada en español
El sistema SHALL rechazar títulos vacíos o de más de 100 caracteres y descripciones de más de 500 caracteres, devolviendo mensajes de error en español.

#### Scenario: Título vacío rechazado
- **WHEN** se intenta crear una tarea con título vacío
- **THEN** la operación falla con mensaje "El título es obligatorio"

#### Scenario: Límites de longitud
- **WHEN** se envía título de 101 caracteres o descripción de 501
- **THEN** la operación falla con mensaje de máximo excedido

### Requirement: Aislamiento de tareas por usuario
El sistema SHALL asociar cada tarea al usuario autenticado que la creó y asegurar que un usuario solo pueda acceder a sus propias tareas, tanto desde la interfaz web como desde el servidor MCP.

#### Scenario: Tarea pertenece al usuario creador
- **WHEN** un usuario autenticado crea una tarea
- **THEN** la tarea queda asociada al `userId` de ese usuario

#### Scenario: Usuario no ve tareas de otros usuarios
- **WHEN** un usuario autenticado lista sus tareas
- **THEN** solo se muestran las tareas asociadas a su `userId`, nunca tareas de otros usuarios

#### Scenario: Acceso a tarea ajena rechazado
- **WHEN** un usuario intenta leer, editar o eliminar una tarea asociada a otro `userId`
- **THEN** el sistema rechaza la operación con error de autorización

### Requirement: Listado filtrado y ordenado por usuario
El sistema SHALL listar las tareas del usuario autenticado ordenadas por fechaCreacion descendente, con filtro por estado (TODAS/PENDIENTE/EN_PROCESO/COMPLETADA) y búsqueda por texto en título o descripción, aplicando siempre el `userId` del usuario autenticado.

#### Scenario: Listar tareas filtra por usuario
- **WHEN** un usuario autenticado lista sus tareas
- **THEN** solo se muestran tareas asociadas a su `userId`, ordenadas de más reciente a más antigua

#### Scenario: Filtrar por estado
- **WHEN** el usuario filtra por EN_PROCESO
- **THEN** solo se muestran tareas en ese estado ordenadas de más reciente a más antigua

#### Scenario: Buscar por texto
- **WHEN** el usuario busca "informe"
- **THEN** se muestran tareas cuyo título o descripción contienen "informe" sin distinguir mayúsculas
