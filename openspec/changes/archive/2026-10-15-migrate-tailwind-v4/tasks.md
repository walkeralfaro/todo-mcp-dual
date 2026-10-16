# Tasks

## 1. Evaluación y preparación

- [x] 1.1 Confirmar tags de versión (`npm view tailwindcss version`, `npm view tailwindcss dist-tags`, `npm view @tailwindcss/postcss version`) y verificar que `latest` resuelve 4.x y que `@next` no se usará salvo beta explícita
- [x] 1.2 Auditar referencias a Tailwind/PostCSS (`grep -rn autoprefixer/tailwind.config/@tailwind/@apply` en repo sin `node_modules`) y verificar que el único uso es `postcss.config.mjs`, `tailwind.config.ts` y `app/globals.css` sin `@apply` ni plugins

## 2. Migración a Tailwind v4

- [x] 2.1 Actualizar dependencias (`npm uninstall tailwindcss autoprefixer` salvo uso detectado en 1.2; `npm install -D tailwindcss@^4 @tailwindcss/postcss@^4`) y verificar que `package.json` + `package-lock.json` resuelven 4.x con `npm ls tailwindcss @tailwindcss/postcss`
- [x] 2.2 Migrar `postcss.config.mjs` al plugin `@tailwindcss/postcss` y verificar que `npx postcss app/globals.css --no-map` (o `npm run dev`) compila sin error de plugin desconocido
- [x] 2.3 Migrar `app/globals.css` a `@import "tailwindcss";` y verificar que `npm run dev` sirve estilos y que las clases usadas (`bg-zinc-*, rounded-*, flex, space-y-*`) siguen generándose
- [x] 2.4 Eliminar `tailwind.config.ts` (tras confirmar que ningún import lo referencia) y verificar con `grep -rn tailwind.config` que no quedan referencias y que `npm run dev` sigue compilando

## 3. Verificación e integración

- [x] 3.1 Ejecutar suite de calidad (`npm test` con `vitest run` y `npm run build` incl. `prisma generate`) y verificar que ambos comandos terminan en verde
- [x] 3.2 Revisión visual de paridad (home, crear/filtrar/completar tarea en `app/page.tsx`, `task-form`, `task-item`, `task-filters`, desktop + móvil) y verificar que no hay regresión respecto a capturas previas a la migración
