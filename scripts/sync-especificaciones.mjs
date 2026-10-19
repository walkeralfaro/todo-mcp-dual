// Genera el índice legible de las especificaciones de OpenSpec.
//
// La fuente de verdad es `openspec/specs/<capacidad>/spec.md` (una carpeta por
// capacidad, requisito del tooling de OpenSpec: un `spec.md` en la raíz de
// `specs/` se ignora al validar y archivar). Este paso concatena esas fuentes
// en un único documento navegable, `docs/especificaciones.md`, con un índice de
// capacidades, requisitos y escenarios.
//
// Idempotente: si el resultado coincide con el documento existente no lo
// reescribe. En arranque y build se usa con --skip-if-missing: sin carpeta de
// specs avisa y sale 0 para no bloquear el arranque ni la compilación, igual que
// `sync-arquitectura.mjs` y `apply-schema-turso.mjs`.
//
// Uso:
//   node scripts/sync-especificaciones.mjs
//   node scripts/sync-especificaciones.mjs --skip-if-missing

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const skipIfMissing = process.argv.includes("--skip-if-missing");

const specsDir = fileURLToPath(new URL("../openspec/specs/", import.meta.url));
const target = fileURLToPath(new URL("../docs/especificaciones.md", import.meta.url));

const GENERATED_NOTE =
  "<!-- GENERADO por scripts/sync-especificaciones.mjs: no editar a mano. -->";

/** Texto de una sección `## <heading>` hasta el siguiente `## `, sin recortes. */
function extractSection(lines, heading) {
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return "";
  const body = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith("## ")) break;
    body.push(lines[i]);
  }
  return body.join("\n").trim();
}

/** Propósito, requisitos y conteos de una capacidad. */
function readCapability(name) {
  const lines = readFileSync(`${specsDir}${name}/spec.md`, "utf8").split("\n");
  const requirements = extractSection(lines, "Requirements");
  return {
    name,
    purpose: extractSection(lines, "Purpose").replace(/\s*\n\s*/g, " ").trim(),
    requirements,
    requirementCount: (requirements.match(/^### Requirement:/gm) ?? []).length,
    scenarioCount: (requirements.match(/^#### Scenario:/gm) ?? []).length,
  };
}

if (!existsSync(specsDir)) {
  if (skipIfMissing) {
    console.log(
      "Sin openspec/specs/: se omite la generación de docs/especificaciones.md.",
    );
    process.exit(0);
  }
  console.error(
    "Falta openspec/specs/: no hay especificaciones que consolidar.",
  );
  process.exit(1);
}

const capabilities = readdirSync(specsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
  .map((entry) => entry.name)
  .filter((name) => existsSync(`${specsDir}${name}/spec.md`))
  .sort()
  .map(readCapability);

if (capabilities.length === 0) {
  const message =
    "openspec/specs/ no contiene ninguna capacidad (spec.md) que consolidar.";
  if (skipIfMissing) {
    console.log(`${message} Se omite la generación.`);
    process.exit(0);
  }
  console.error(message);
  process.exit(1);
}

const totalRequirements = capabilities.reduce(
  (sum, capability) => sum + capability.requirementCount,
  0,
);
const totalScenarios = capabilities.reduce(
  (sum, capability) => sum + capability.scenarioCount,
  0,
);

const header = [
  GENERATED_NOTE,
  "",
  "# Especificaciones de la Todo App",
  "",
  "Índice legible de todas las capacidades del proyecto. La fuente de verdad es",
  "una carpeta por capacidad (`openspec/specs/<capacidad>/spec.md`); este",
  "documento se regenera con `npm run specs:doc` (también corre en `predev` y",
  "`prebuild`), así que no debe editarse a mano.",
  "",
  `- Capacidades: ${capabilities.length}`,
  `- Requisitos: ${totalRequirements}`,
  `- Escenarios: ${totalScenarios}`,
  "",
  "## Índice",
  "",
  "| # | Capacidad | Requisitos | Escenarios |",
  "| --- | --- | --- | --- |",
  ...capabilities.map(
    (capability, index) =>
      `| ${index + 1} | [${capability.name}](#${index + 1}-${capability.name}) | ${capability.requirementCount} | ${capability.scenarioCount} |`,
  ),
]
  .join("\n")
  .trimEnd();

const sections = capabilities.map((capability, index) =>
  [
    `## ${index + 1}. ${capability.name}`,
    "",
    `**Propósito.** ${capability.purpose}`,
    "",
    capability.requirements,
  ]
    .join("\n")
    .trimEnd(),
);

const document = `${[header, ...sections].join("\n\n---\n\n")}\n`;

if (existsSync(target) && readFileSync(target, "utf8") === document) {
  console.log(
    `OK docs/especificaciones.md ya coincide (${capabilities.length} capacidades, ${totalRequirements} requisitos).`,
  );
  process.exit(0);
}

mkdirSync(fileURLToPath(new URL("../docs/", import.meta.url)), { recursive: true });
writeFileSync(target, document);

const kib = Math.round(Buffer.byteLength(document) / 1024);
console.log(
  `OK especificaciones consolidadas en docs/especificaciones.md (${capabilities.length} capacidades, ${totalRequirements} requisitos, ${totalScenarios} escenarios, ${kib} KiB).`,
);
