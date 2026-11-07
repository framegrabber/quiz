// Validates quiz and catalog files: `npm run validate -- <file|dir|url>...`. Exit code 1 if any file is invalid.
import { parseQuiz, type FormatError } from "../src/format/parse.ts";
import { fitWarnings } from "../src/format/fitWarnings.ts";
import { isCatalogDocument, parseCatalog } from "../src/format/catalog.ts";
import { collectJsonFiles, loadJson } from "./files.ts";

async function validate(
  source: string,
): Promise<{ errors: FormatError[]; warnings: FormatError[] }> {
  const loaded = await loadJson(source);
  if (!loaded.ok)
    return { errors: [{ path: "", message: loaded.message }], warnings: [] };
  if (isCatalogDocument(loaded.data)) {
    const result = parseCatalog(loaded.data);
    return { errors: result.ok ? [] : result.errors, warnings: [] };
  }
  const result = parseQuiz(loaded.data);
  if (!result.ok) return { errors: result.errors, warnings: [] };
  return { errors: [], warnings: fitWarnings(result.quiz) };
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("Aufruf: npm run validate -- <Datei|Ordner|URL>...");
  process.exit(2);
}

const files = (await Promise.all(targets.map(collectJsonFiles))).flat();
if (files.length === 0) {
  console.error("Keine Quiz-Dateien gefunden.");
  process.exit(1);
}

let invalid = 0;
for (const file of files) {
  const { errors, warnings } = await validate(file);
  const line = (e: FormatError, prefix = "") =>
    `${file}: ${e.path ? `${e.path}: ` : ""}${prefix}${e.message}`;
  errors.forEach((e) => console.error(line(e)));
  warnings.forEach((w) => console.warn(line(w, "Warnung: ")));
  if (errors.length > 0) invalid++;
  else
    console.log(
      `${file}: OK${warnings.length ? ` (${warnings.length} Warnungen)` : ""}`,
    );
}

console.log(`\n${files.length - invalid} von ${files.length} Dateien gültig.`);
process.exit(invalid > 0 ? 1 : 0);
