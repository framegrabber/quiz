// Validates quiz files: `npm run validate -- <file|dir|url>...`. Exit code 1 if any file is invalid.
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { parseQuiz, type FormatError } from "../src/format/parse.ts";
import { fitWarnings } from "../src/format/fitWarnings.ts";

const IGNORED_FILES: Record<string, true> = {
  "package.json": true,
  "package-lock.json": true,
  "tsconfig.json": true,
};

async function collect(target: string): Promise<string[]> {
  if (/^https?:\/\//.test(target)) return [target];
  if (!(await stat(target)).isDirectory()) return [target];
  const files: string[] = [];
  for (const entry of await readdir(target, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const path = join(target, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(path)));
    else if (entry.name.endsWith(".json") && !IGNORED_FILES[entry.name])
      files.push(path);
  }
  return files;
}

async function load(source: string): Promise<string> {
  if (!/^https?:\/\//.test(source)) return readFile(source, "utf8");
  const response = await fetch(source, { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function validate(
  source: string,
): Promise<{ errors: FormatError[]; warnings: FormatError[] }> {
  let data: unknown;
  try {
    data = JSON.parse(await load(source));
  } catch (error) {
    const reason =
      error instanceof SyntaxError
        ? `Kein gültiges JSON: ${error.message}`
        : String(error);
    return { errors: [{ path: "", message: reason }], warnings: [] };
  }
  const result = parseQuiz(data);
  if (!result.ok) return { errors: result.errors, warnings: [] };
  return { errors: [], warnings: fitWarnings(result.quiz) };
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("Aufruf: npm run validate -- <Datei|Ordner|URL>...");
  process.exit(2);
}

const files = (await Promise.all(targets.map(collect))).flat();
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
