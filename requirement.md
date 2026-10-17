# Requirements: Todo App con Arquitectura Dual (UI + Servidor MCP)

## 1. Visión General del Proyecto
Desarrollar una aplicación web de gestión de tareas ("Todo App") moderna que implemente una **arquitectura de estado centralizado**. El backend debe alimentar tanto a la interfaz web de usuario (mediante Server Actions de Next.js) como a agentes de inteligencia artificial externos (mediante un servidor MCP expuesto por HTTP/SSE), utilizando la misma capa de persistencia.

---

## 2. Stack Tecnológico Obligatorio
- Next.js (App Router)
- React 19
- Tailwind CSS
- Prisma ORM
- SQLite
- @modelcontextprotocol/server (v2; antes sdk v1)
- mcp-handler (v2)
- @vercel/mcp-adapter
- Zod
- Vitest
- Playwright

---

## 3. Modelo de Datos (Esquema Prisma)

La entidad principal del sistema es `Task` (Tarea), estructurada con los siguientes campos:

- `id`: `String` (UUID autogenerado o clave única primaria)
- `titulo`: `String` (Obligatorio)
- `descripcion`: `String` (Opcional)
- `estado`: `Enum` (Valores permitidos: `PENDIENTE`, `EN_PROCESO`, `COMPLETADA`)
- `fechaCreacion`: `DateTime` (Valor por defecto: `now()`)
- `fechaCulminada`: `DateTime` (Opcional, se registra automáticamente al pasar a `COMPLETADA`)

El esquema también incluye las entidades de autenticación de Better Auth (`User`, `Session`, `Account`, `Verification`) y `McpToken`, que representa un token de acceso al servidor MCP:

- `token`: `String` único (hash SHA-256 del valor en claro; el valor en claro nunca se persiste)
- `tokenPrefix`: `String?` (primeros 8 caracteres del token, para identificarlo en la UI)
- `expiresAt`: `DateTime?` (por defecto, 90 días desde la creación)
- `lastUsedAt`: `DateTime?` (último uso autenticado contra `/api/mcp`)

---

## 4. Requisitos Funcionales

1. **Interfaz de Usuario (Humana):**
   - Visualización de lista de tareas con filtros por estado.
   - Formulario interactivo para la creación de nuevas tareas utilizando **Server Actions**.
   - Capacidad de actualizar el estado de una tarea desde el frontend.
2. **Servidor MCP (Agentes de IA):**
   - Exposición de un endpoint HTTP/SSE en la ruta `/api/mcp` utilizando `@vercel/mcp-adapter` y el SDK oficial.
   - Definición de herramientas (*Tools*) para que la IA pueda realizar operaciones CRUD sobre las tareas.
   - Validación estricta de los parámetros de entrada mediante esquemas **Zod** en cada herramienta MCP.
3. **Consistencia de Estado:**
   - Cualquier mutación realizada por un agente de IA a través del servidor MCP debe reflejarse de forma inmediata en la base de datos y viceversa para el usuario web.
4. **Rutas y protección:**
   - Landing pública en `/` (presentación del producto y punto de acceso).
   - La aplicación de tareas vive en `/tareas`: exige sesión y, sin ella, redirige a `/?auth=login&next=<ruta>` conservando la ruta pedida para volver tras autenticarse.
   - Página de tokens MCP en `/mcp`, también protegida.
   - Navbar compartida en todas las rutas con el estado de sesión (iniciar sesión, registrarse y cerrar sesión).
5. **Tokens MCP:**
   - Generación bajo demanda en `/mcp` (solo con sesión): valor en claro `tmcp_…` mostrado una única vez; se persisten el hash SHA-256 (`mcp_token.token`) y el prefijo visible (`tokenPrefix`).
   - Expiración por defecto de 90 días y `lastUsedAt` actualizado en cada uso autenticado.
   - Revocación inmediata (borrado de la fila) desde `/mcp`.
   - Uso desde clientes MCP mediante la cabecera `Authorization: Bearer <token>` contra `/api/mcp`.

---

## 5. Estrategia de Calidad y Testing

El ciclo de desarrollo exigirá pruebas automatizadas obligatorias antes de dar por completada cada etapa:

- **Pruebas Unitarias e Integración (Vitest):**
  - Validación de esquemas Zod en las herramientas MCP.
  - Pruebas de la capa de servicios de Prisma con SQLite.
  - Simulación de llamadas al manejador de la ruta MCP.
- **Pruebas End-to-End - E2E (Playwright):**
  - Pruebas de flujo completo en navegador: Creación, listado y actualización de tareas desde la interfaz gráfica de Next.js.

---

## 6. Entregables de Arquitectura (Metodología OpenSpec)

El agente de desarrollo encargado deberá generar y mantener actualizados los siguientes archivos de control:
1. `spec.md`: Especificación técnica detallada y criterios de aceptación.
2. `plan.md`: Plan de implementación arquitectónica paso a paso.
3. `tasks.md`: Lista granular de tareas atómicas y ejecutables.