# Design

## Context

Ver `proposal.md` para la motivación. Estado actual relevante para las decisiones:

- `docs/arquitectura-todo-mcp.html` (≈1,86 MB) ya está versionado en `HEAD` junto a los recibos `.finalize.json` de archify. El HTML es autocontenido: sus únicas referencias externas son la atribución a `https://github.com/tt-a1i/archify` (un enlace, no una carga) y el `xmlns` de sus SVG inline.
- El proyecto **no tiene** carpeta `public/` (no hay ningún recurso estático propio hoy).
- `proxy.ts` (middleware) matchea solo `/tareas` y `/mcp/:path*`, así que un recurso estático nuevo queda público sin tocar la protección de rutas.
- Orden de resolución de Next.js (docs locales, `01-app/03-api-reference/05-config/01-next-config-js/rewrites.md`): `beforeFiles` se evalúa **antes** de los archivos estáticos de `public/`. La documentación de `public-folder.md` indica además que los archivos de `public/` se sirven con `Cache-Control: public, max-age=0`.
- `components/site-header.tsx`: marca + `<nav className="hidden items-center gap-1 sm:flex">` (solo con sesión) + acciones de sesión + panel móvil `#mobile-nav` (solo con sesión, tras un botón hamburguesa).
- `components/landing/landing-close.tsx`: `LandingFooter` ya lista enlaces textuales ("La demo", "Conectar un agente", "Herramientas MCP", "Mis tareas", "Tokens MCP") con `min-h-11`.
- `e2e/landing.spec.ts:78-83` fija el orden de tabulación del header anónimo: primer `Tab` → marca; segundo `Tab` → `auth-login-btn`. `e2e/landing.spec.ts:97-108` exige `scrollWidth <= innerWidth` y orden marca → "Iniciar sesión" → "Registrarse" a 390, 768 y 1440 px.
- `e2e/nav-movil.spec.ts` exige que `nav-menu-btn` exista solo con sesión, que los enlaces del panel sean ≥44 px, y que a 1024/1440 px ningún control del header (incluido `auth-signout-btn`) se salga del viewport.
- Medición del header anónimo a 390 px: 350 px útiles (`px-5` sobre 390) frente a ≈313 px de contenido (marca + "Iniciar sesión" + "Registrarse" con `gap-2`/`gap-4`), es decir ≈37 px libres: **no cabe** un control de 44 px sin romper `landing.spec.ts:107`.
- Specs vigentes que acotan el cambio: `user-auth-ui` ("área táctil mínima de 44 × 44 px", "alcanzables en todos los anchos responsivos, incluido móvil"), `landing-page` ("sin scroll horizontal" a 390/768/1440 px, una sola acción primaria por pantalla) y `todo-tasks` (revisión de UI con `playwright-cli` a 1440/390 px y `web-design-guidelines`).

## Goals / Non-Goals

**Goals:**
- Servir el documento de arquitectura existente en una URL pública y estable, sin duplicar su contenido ni reescribirlo.
- Que el recurso publicado no pueda desfasarse del documento versionado sin que nadie lo note.
- Hacerlo descubrible desde la app en cualquier ancho, sin degradar la cabecera ni la landing ya verificadas.

**Non-Goals:**
- No se rediseña ni se edita el contenido de `docs/arquitectura-todo-mcp.html` (se publica tal cual).
- No se incrusta con `iframe` ni se convierte en página de Next.js con componentes React.
- No se publica `docs/arquitectura.md` ni se añade índice/buscador de documentación.
- No se cambian `data-testid` existentes, el esquema Prisma, la API MCP ni el flujo de autenticación.

## Decisions

**1. Publicar el archivo estático y mapear la URL con una reescritura `beforeFiles`.**
El documento se copia a `public/arquitectura.html` y `next.config.ts` añade `beforeFiles: [{ source: "/arquitectura", destination: "/arquitectura.html" }]`. El orden documentado por Next garantiza que la reescritura gana al estático, así que la URL pública limpia es `/arquitectura` y `/arquitectura.html` sigue funcionando como canónico. El middleware no interviene porque no matchea esa ruta.
- Alternativa descartada: enlazar directamente a `/arquitectura.html`. Funciona sin configuración, pero expone la extensión en la barra de direcciones de una página pensada para exhibirse.
- Alternativa descartada: página de app (`app/arquitectura/page.tsx`) que embeba el HTML con `iframe` o con `dangerouslySetInnerHTML`. Añade superficie y riesgo (CSP, `iframe`, hidratación) a cambio de nada: el archivo ya es HTML completo y autocontenido.
- Alternativa descartada: *route handler* que lea el archivo de `docs/` en tiempo de petición. Mete E/S de disco y rutas del repositorio en el runtime del servidor para servir un recurso inmutable.
- Alternativa descartada: enlace simbólico `public/arquitectura.html → ../docs/...`. El copiado del directorio `public` en el build y en plataformas de despliegue no garantiza resolver simlinks.

**2. La fuente canónica sigue en `docs/`; la copia la hace un script idempotente en `predev`/`prebuild`.**
`scripts/sync-arquitectura.mjs` copia `docs/arquitectura-todo-mcp.html` → `public/arquitectura.html`, crea `public/` si no existe, y con `--skip-if-missing` (mismo patrón que `scripts/apply-schema-turso.mjs`) avisa y sale con éxito si la fuente no está. `package.json` gana `predev` y `prebuild` apuntando a él, de modo que la sincronización es automática en los dos caminos habituales de uso.
- Motivo para no mover el archivo a `public/`: los recibos `docs/arquitectura-todo-mcp.finalize.json` y `.delivery.json` apuntan a la ruta actual y son la evidencia de entrega del documento; mover el HTML los dejaría describiendo un archivo inexistente.
- Alternativa descartada: copia manual documentada en `AGENTS.md`. Cero código nuevo, pero el desfase silencioso entre `docs/` y `public/` es exactamente el fallo que el requisito de sincronización quiere evitar.
- Alternativa descartada: regenerar con la CLI de archify escribiendo ya en `public/`. El binario vive en `.opencode/skills/`, que está en `.gitignore`: no se versiona, así que el paso no es reproducible para otra persona ni en el despliegue.
- El archivo publicado se comitea igualmente: si alguien ejecuta `next build` sin pasar por los scripts de npm, el recurso ya existe en el repositorio.

**3. Enlace nativo `<a>`, no `next/link`, abierto en pestaña nueva.**
`<a href="/arquitectura" target="_blank" rel="noreferrer">` evita que el router de Next intente prefetch/navegación de cliente sobre un archivo estático y deja claro que es un documento externo a la app. La pestaña nueva preserva la demo en curso (la landing o la lista de tareas) y el `noreferrer` evita filtrar la URL de origen.
- Alternativa descartada: `next/link` sin `target`. Navegación de cliente sobre un HTML estático: pierde la página actual y no aporta prefetch útil.
- Alternativa descartada: modal interno con `iframe`. Duplica el problema de tamaño y complica foco y accesibilidad.

**4. El enlace va después del bloque de sesión en el DOM y solo se muestra desde 640 px, con la etiqueta a partir de 1024 px.**
Colocarlo en último lugar del contenedor de controles mantiene el orden de tabulación que `e2e/landing.spec.ts:78-83` verifica (marca → acciones de acceso → documentación) y evita reordenaciones visuales agresivas: la marca queda a la izquierda y los controles a la derecha. Por debajo de 640 px se oculta en la barra porque la medición del punto anterior demuestra que no cabe: la exposición en móvil se cubre desde el panel `#mobile-nav` (con sesión) y desde el pie de la landing (visitante anónimo), ambos ya probados a 390 px.

La etiqueta visible entra a partir de 1024 px (`lg`): la verificación visual a 640, 768 y 900 px con sesión mostró que, con el texto visible, los controles del header se partían en dos y tres líneas (aunque sin scroll horizontal, porque el contenedor tiene altura fija). Entre 640 y 1023 px el enlace va solo con icono, con `aria-label` y `title` que conservan el nombre accesible. `e2e/arquitectura.spec.ts` fija ambas cosas: una sola línea por control en ese rango y etiqueta visible desde `lg`.

- Alternativa descartada: dejar el enlace siempre visible en la barra con icono de 44 px. Rompe `scrollWidth <= innerWidth` a 390 px; exigiría degradar las acciones de acceso para hacerle sitio.
- Alternativa descartada: mover el enlace al `<nav>` de enlaces de sesión (visible solo con sesión). El visitante anónimo —el caso que más importa para una demo de portafolio— nunca lo vería.
- Alternativa descartada: crear un menú hamburguesa también para el header anónimo. Cambia la cabecera ya validada (y sus pruebas) para resolver algo que el pie de la landing ya resuelve.

**5. Etiqueta e icono explícitos.**
Texto corto ("Cómo está hecha") más icono `Network` de `lucide-react` (versión ya instalada), con `title`/`aria-label` completo. Un icono suelto no comunica que dentro hay explicación de arquitectura, y un texto largo competiría con las acciones de sesión.
- Alternativa descartada: "Arquitectura". Es más frío y no dice que el documento sirve para entender el proyecto.

**6. La verificación se apoya en las suites existentes, sin relajar aserciones.**
Nuevo `e2e/arquitectura.spec.ts` para el recurso y el enlace; `landing.spec.ts` y `nav-movil.spec.ts` se mantienen tal cual como red de seguridad de que la cabecera y la landing no se degradan. Solo se tocarán si la verificación demuestra que el enlace introduce una regresión real.
- Alternativa descartada: ajustar `landing.spec.ts` para "hacer sitio" al enlace móvil. Convierte el test en un permiso para desbordar.

## Risks / Trade-offs

- **≈1,8 MB duplicados en el repositorio y en el artefacto de build** → la copia se genera automáticamente, así que no hay ediciones manuales; el documento solo se descarga quien abre `/arquitectura` y la plataforma lo sirve comprimido. Se acepta el coste a cambio de que la demo sea autoexplicativa.
- **Cabecera con sesión en la franja 640-1023 px** → la verificación visual a 640/768/900 px encontró el defecto real: sin recortes ni scroll horizontal, pero con las etiquetas de los controles partidas en dos y tres líneas al añadir la etiqueta del enlace. Mitigación aplicada: etiqueta a partir de `lg` e icono con `aria-label`/`title` por debajo, más un E2E que exige una sola línea por control en ese rango (ver Decisión 4).
- **`predev`/`prebuild` inesperados para quien invoca `next` directamente** → mitigación: la copia se comitea y el script es tolerante (no rompe si falta la fuente); `AGENTS.md` documenta el paso.
- **Fuente y copia pueden divergir en un entorno que no ejecuta los hooks** → mitigación: el E2E comprueba que lo servido contiene el artefacto de arquitectura esperado, y el script es idempotente, así que re-ejecutarlo siempre converge.
- **Enlace externo de atribución a archify dentro del documento publicado** → se acepta: es parte de la licencia/atribución del artefacto, es un enlace (no una carga) y se menciona en `README.md`.
- **Verificación visual manual** → las tareas incluyen `playwright-cli` a 1440 y 390 px y revisión con `web-design-guidelines`, como exige `todo-tasks`; los hallazgos se corrigen o se justifican.

## Migration Plan

Sin migración de datos ni cambios de esquema. Despliegue normal: el recurso estático, la reescritura y los enlaces viajan en el mismo commit. Rollback: revertir el commit; al desaparecer el archivo y la reescritura, `/arquitectura` deja de existir y los enlaces se retiran con él, sin estado persistido que restaurar.
