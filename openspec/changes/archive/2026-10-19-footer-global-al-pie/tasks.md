# Tasks

## 1. Componente y layout

- [x] 1.1 Crear `components/site-footer.tsx` (server component) con el crédito "developed with ❤️ by walker alfaro", `border-t border-ink/10 px-5 py-4 text-center text-[13px] text-muted`, `lang="en"` y corazón accesible; verificar con `npm run lint` y `npm run typecheck`
- [x] 1.2 Insertar `<SiteFooter />` tras `</main>` en `app/layout.tsx`; verificar visualmente en `/`, `/tareas` y `/mcp` (390 y 1024 px) que el pie queda al fondo con contenido corto y al final del documento con contenido largo, sin scroll horizontal

## 2. Consolidación de pies existentes

- [x] 2.1 Quitar el `<footer>` de `app/(protegido)/mcp/page.tsx` y el de `app/(protegido)/tareas/page.tsx`; verificar que cada página muestra un único pie (el global) sin romper el layout de la rejilla en desktop
- [x] 2.2 Quitar la línea `© 2026 Todo App` de `LandingFooter` conservando el mapa del sitio y `data-testid="footer-arquitectura"`; verificar que la landing muestra un único pie

## 3. Documentación y gobernanza

- [x] 3.1 Reescribir `AGENTS.md` §4 como política de testing proporcional: sin tests nuevos para cambios puramente presentacionales (solo `lint` + `typecheck` + revisión visual), Vitest para comportamiento, E2E solo para flujos críticos afectados, y sin exigir la suite completa por cada cambio
- [x] 3.2 Añadir en `requirement.md` (sección de rutas y protección) una línea sobre el pie de página global y su anclaje al fondo; verificar coherencia con la spec `site-footer`

## 4. Verificación

- [x] 4.1 Ejecutar `npm run lint` y `npm run typecheck` (sin `npm test` ni `npm run test:e2e`: cambio presentacional)
- [x] 4.2 Validar con `openspec validate footer-global-al-pie --strict` y confirmar que no quedan dos pies en ninguna página
