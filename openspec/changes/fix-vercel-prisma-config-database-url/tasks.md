# Tasks — fix-vercel-prisma-config-database-url

## 1. Fallback de DATABASE_URL en prisma.config.ts

- [x] 1.1 Cambiar `datasource.url` a `process.env.DATABASE_URL ?? "file:./dev.db"` en `prisma.config.ts`, y verificar con `npx tsc --noEmit` en verde
- [x] 1.2 Simular Vercel en local sin `DATABASE_URL` (`env -u DATABASE_URL npx prisma generate` y `env -u DATABASE_URL npx prisma validate`), y verificar que ambos terminan sin `PrismaConfigEnvError`
- [x] 1.3 Verificar sin regresiones con `npm test`, `npm run build` y `npx openspec validate "fix-vercel-prisma-config-database-url" --type change` en verde, y dejar constancia de que el redeploy en Vercel queda en manos del usuario
