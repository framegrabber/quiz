// Generates the quiz catalog: `npm run catalog -- <content dir>` writes <content dir>/catalog.json.
// Exit code 1 (and nothing written) if any quiz is invalid.
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildCatalog } from "./buildCatalog.ts";
import { CATALOG_FILE } from "./files.ts";

const dir = process.argv[2];
if (!dir || process.argv.length > 3) {
  console.error("Aufruf: npm run catalog -- <Ordner>");
  process.exit(2);
}

const result = await buildCatalog(dir);
if (!result.ok) {
  for (const { file, errors } of result.failures)
    for (const e of errors)
      console.error(`${file}: ${e.path ? `${e.path}: ` : ""}${e.message}`);
  console.error("\nKatalog nicht geschrieben.");
  process.exit(1);
}

const output = join(dir, CATALOG_FILE);
await writeFile(output, `${JSON.stringify(result.catalog, null, 2)}\n`);
console.log(`${output}: ${result.catalog.quizzes.length} Quizze`);
