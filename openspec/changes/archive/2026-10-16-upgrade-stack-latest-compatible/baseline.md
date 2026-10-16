# Baseline 2026-10-16 — upgrade-stack-latest-compatible (tarea 1.1)

- Rama: main (cf3426a), Node v24.16.0, npm 12.0.2
- `npm list --depth=0`: next 15.5.28, react 19.3.1, prisma 6.19.3, client 6.19.3,
  adapter-libsql 6.19.3, libsql 0.15.15, sdk 1.26.0, mcp-handler 1.1.0,
  zod 3.25.76, vitest 2.1.9, typescript 5.9.3, jsdom 25.0.1,
  plugin-react 4.7.0, types/node 22.20.5, lucide 1.57.0, cn 0.4.0,
  tailwind 4.3.3, playwright 1.64.1, jest-dom 6.9.1, testing-react 16.3.3.
- `npm test`: 7 ficheros, 37/37 tests PASS (vitest 2.1.9, ~19s).
- `npx tsc --noEmit`: 2 errores PREEXISTENTES en components/task-item.test.tsx:98
  (TS2352 conversion undefined->FormData, TS2493 tuple). No bloquean `next build`.
- `npm run build`: OK (Next 15.5.28, 4 paginas, sin errores).
