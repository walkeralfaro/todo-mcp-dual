# Proposal

## Why

El proyecto ya tiene una explicación interactiva de su arquitectura (`docs/arquitectura-todo-mcp.html`: mapa de componentes, ERD y secuencias, con temas claro/oscuro), pero vive solo dentro del repositorio: quien visita la app no puede descubrir cómo está construida. Publicarla en la web y enlazarla desde la interfaz convierte la demo en algo autoexplicativo, que es justo lo que se espera de un proyecto de portafolio.

## What Changes

- **Publicar la documentación como recurso estático:** servir el HTML autocontenido que ya existe en `docs/` desde la ruta pública limpia `/arquitectura`, sin exponer datos de usuario y sin introducir nuevas dependencias de runtime.
- **Mantenerlo sincronizado:** añadir un script de sincronización idempotente que copie la fuente versionada de `docs/` a `public/`, enganchado a `predev` y `prebuild`, de modo que el recurso publicado nunca quede desfasado del documento regenerado.
- **Hacerlo descubrible:** enlace secundario "Cómo está hecha" con icono en la navbar (≥640 px, abierto en pestaña nueva), entrada equivalente en el panel de navegación móvil con sesión y enlace en el pie de la landing (alcanzable a cualquier ancho, incluido el visitante anónimo a 390 px).
- **Cubrirlo con pruebas:** E2E que verifican que `/arquitectura` responde HTML 200 con el artefacto esperado, que el enlace existe con destino, `target` y área táctil correctos, y que el header sigue sin desbordar a 390/768/1440 px.

No cambia el modelo de datos, ni la API del servidor MCP, ni el flujo de autenticación. Fuera de alcance: rediseñar la página `/arquitectura`, incrustarla con `iframe` dentro de una página de Next.js, añadir buscador o índice propio de documentación, y publicar `docs/arquitectura.md` como página.

## Capabilities

### New Capabilities

- `architecture-docs`: publicación del documento de arquitectura como recurso estático del sitio (`/arquitectura`), con la garantía de que es autocontenido, no expone datos de usuario y se publica desde una fuente versionada y sincronizada.

### Modified Capabilities

- `landing-page`: gana el requisito de ofrecer un enlace visible a `/arquitectura` a cualquier ancho (390/768/1440 px), secundario respecto a la única llamada a la acción principal y sin provocar desbordes.
- `user-auth-ui`: gana el requisito del enlace a `/arquitectura` en la navbar compartida (visible desde 640 px, alcanzable en móvil desde el panel con sesión, área táctil de 44 × 44 px, foco visible y sin alterar el orden de tabulación de la marca y las acciones de sesión).

## Impact

- **Recurso nuevo:** `public/arquitectura.html` (copia generada de `docs/arquitectura-todo-mcp.html`, ~1,8 MB); `public/` no existe todavía y se crea.
- **Configuración:** `next.config.ts` gana una reescritura `beforeFiles` para servir `/arquitectura` desde el archivo estático; `package.json` gana los hooks `predev`/`prebuild`.
- **Scripts:** `scripts/sync-arquitectura.mjs` (nuevo), tolerante a la ausencia de la fuente.
- **Interfaz:** `components/site-header.tsx` (enlace desktop + entrada del panel móvil) y `components/landing/landing-close.tsx` (enlace del pie de la landing).
- **Pruebas y docs:** `e2e/arquitectura.spec.ts` (nuevo), revisión de `e2e/landing.spec.ts` y `e2e/nav-movil.spec.ts`; `README.md` y `AGENTS.md` documentan la publicación y su regeneración.
- **Riesgo operativo:** la copia añade ~1,8 MB al árbol de trabajo y al build; se mitiga con sincronización automática y compresión de la plataforma, y no afecta al tiempo de carga de la app porque solo se descarga quien abre `/arquitectura`.
