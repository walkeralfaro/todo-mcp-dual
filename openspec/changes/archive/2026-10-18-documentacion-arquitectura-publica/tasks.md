# Tasks

## 1. Publicación del recurso y URL limpia

- [x] 1.1 Antes de tocar configuración, leer las guías instaladas `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/public-folder.md` y `.../05-config/01-next-config-js/rewrites.md`, y confirmar con ellas que `beforeFiles` se evalúa antes de los estáticos de `public/`; anotar en el propio commit la sección consultada.
- [x] 1.2 Crear `scripts/sync-arquitectura.mjs` que copie `docs/arquitectura-todo-mcp.html` a `public/arquitectura.html`, cree `public/` si falta y soporte `--skip-if-missing`; verificar que dos ejecuciones seguidas dejan el mismo archivo (idempotencia) y que con la fuente renombrada temporalmente el script sale con éxito informando la omisión.
- [x] 1.3 Añadir `predev` y `prebuild` en `package.json` apuntando al script; verificar con `npm run prebuild` que `public/arquitectura.html` existe y coincide byte a byte con la fuente (`cmp`), y con `npm run dev` que el archivo se publica al arrancar.
- [x] 1.4 Añadir la reescritura `beforeFiles` `/arquitectura` → `/arquitectura.html` en `next.config.ts`; verificar con el servidor de desarrollo en marcha que `curl -sI http://localhost:3000/arquitectura` devuelve `200` con `Content-Type: text/html` y que `/arquitectura.html` responde lo mismo.
- [x] 1.5 Comitear la copia generada en `public/` junto al script y la configuración; verificar con `git status --short` que `public/arquitectura.html` queda versionado y que no se ha movido ni editado el documento fuente de `docs/`.
- [x] 1.6 Crear `e2e/arquitectura.spec.ts` con los casos del recurso: `/arquitectura` responde `200` HTML sin redirección al modal de acceso y contiene el marcador del artefacto (`data-archify-artifact="explainer"`), y `/arquitectura.html` sirve el mismo documento; verificar ejecutando `npm run test:e2e -- e2e/arquitectura.spec.ts` (requiere `.env` con Turso y el puerto 3000 libre).
- [x] 1.7 Documentar en `AGENTS.md` y `README.md` que el documento de arquitectura se publica desde `docs/` a `public/` con `npm run prebuild`/`predev` y que se regenera con archify; verificar que los comandos escritos son los que realmente existen en `package.json`.

## 2. Descubrimiento en la interfaz

- [x] 2.1 Añadir el enlace a `/arquitectura` en `components/site-header.tsx` como `<a target="_blank" rel="noreferrer" data-testid="nav-arquitectura">` con texto e icono, `hidden sm:inline-flex`, `h-11 min-w-11`, colores `text-muted hover:text-ink` y colocado después del bloque de sesión en el DOM; añadir la misma entrada al panel `#mobile-nav`; verificar que `npm run lint` y `npm run typecheck` pasan.
- [x] 2.2 Añadir el enlace a `/arquitectura` en `LandingFooter` (`components/landing/landing-close.tsx`) con el mismo estilo `min-h-11` que los enlaces vecinos; verificar que `npm run lint` pasa y que el enlace aparece a 390 px sin desbordar.
- [x] 2.3 Ampliar `e2e/arquitectura.spec.ts` con los casos del enlace: visible y con `target="_blank"` y `href` correcto desde 640 px, área táctil ≥44 × 44 px, foco visible (outline de 2 px) al tabular, alcanzable desde el panel móvil con sesión a 390 px, y enlace del pie visible y navegable por un visitante anónimo a 390 px; verificar ejecutando el spec.
- [x] 2.4 Verificar la no-regresión de la cabecera y la landing sin relajar aserciones: `npm run test:e2e -- e2e/landing.spec.ts e2e/nav-movil.spec.ts`; si el enlace de la barra desborda a 1024 px con sesión, limitarlo a `lg` y dejar constancia del motivo en el commit.
- [x] 2.5 Añadir al `README.md` una sección "Cómo está hecha" que enlace a `/arquitectura` y mencione que el documento es autocontenido y que su atribución a archify es un enlace externo; verificar leyendo la sección renderizada en el repositorio.

## 3. Integración y cierre

- [x] 3.1 Ejecutar `npm run lint`, `npm run typecheck` y `npm test` y resolver cualquier fallo antes de continuar.
- [x] 3.2 Ejecutar la suite E2E completa con `npm run test:e2e` (con `.env` y puerto 3000 libre) y confirmar que pasan también los flujos de autenticación, tareas y tokens MCP.
- [x] 3.3 Revisar visualmente con `playwright-cli` a 1440 y 390 px, en estado anónimo y con sesión, la cabecera y el pie modificados; guardar las capturas y corregir o justificar cada hallazgo de recorte, solape o desbordamiento.
- [x] 3.4 Pasar `web-design-guidelines` sobre las superficies tocadas (enlace de la navbar, entrada del panel móvil, enlace del pie) y registrar los hallazgos con su corrección o su justificación.
- [x] 3.5 Comprobar la integridad de lo publicado: volver a ejecutar `npm run prebuild` y confirmar con `cmp` que `public/arquitectura.html` coincide con `docs/arquitectura-todo-mcp.html`, y que `/arquitectura` sirve el documento vigente tras un `npm run dev` limpio.
- [x] 3.6 Validar el cambio con `openspec validate 2026-10-18-documentacion-arquitectura-publica --strict` y marcar todas las tareas de este documento antes de proponer el archivo del cambio.
