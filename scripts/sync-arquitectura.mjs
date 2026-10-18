// Publica la documentación de arquitectura como recurso estático del sitio.
//
// La fuente de verdad vive en `docs/arquitectura-todo-mcp.html` (documento
// autocontenido generado con archify y versionado junto a sus recibos). Next.js
// solo sirve estáticos desde `public/`, así que este paso copia el documento a
// `public/arquitectura.html`, que `next.config.ts` publica en `/arquitectura`.
//
// Idempotente: si la copia ya coincide con la fuente no la reescribe. En
// arranque y build se usa con --skip-if-missing: sin el documento (por ejemplo
// un clon sin `docs/`) avisa y sale 0 para no bloquear el arranque ni la
// compilación, igual que `apply-schema-turso.mjs`.
//
// Uso:
//   node scripts/sync-arquitectura.mjs
//   node scripts/sync-arquitectura.mjs --skip-if-missing

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const skipIfMissing = process.argv.includes("--skip-if-missing");

const source = fileURLToPath(
  new URL("../docs/arquitectura-todo-mcp.html", import.meta.url),
);
const target = fileURLToPath(
  new URL("../public/arquitectura.html", import.meta.url),
);

if (!existsSync(source)) {
  if (skipIfMissing) {
    console.log(
      "Sin docs/arquitectura-todo-mcp.html: se omite la publicación de la documentación.",
    );
    process.exit(0);
  }
  console.error(
    "Falta docs/arquitectura-todo-mcp.html: no hay documento que publicar.",
  );
  process.exit(1);
}

const document = readFileSync(source);

if (existsSync(target) && readFileSync(target).equals(document)) {
  console.log("OK public/arquitectura.html ya coincide con la fuente.");
  process.exit(0);
}

mkdirSync(fileURLToPath(new URL("../public/", import.meta.url)), {
  recursive: true,
});
writeFileSync(target, document);

const kib = Math.round(document.byteLength / 1024);
console.log(`OK documentación publicada en public/arquitectura.html (${kib} KiB).`);
