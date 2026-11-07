import { basename, relative, sep } from "node:path";
import { parseQuiz, type FormatError } from "../src/format/parse.ts";
import {
  CATALOG_VERSION,
  catalogEntry,
  type Catalog,
} from "../src/format/catalog.ts";
import { CATALOG_FILE, collectJsonFiles, loadJson } from "./files.ts";

export interface CatalogFailure {
  file: string;
  errors: FormatError[];
}

export type BuildResult =
  { ok: true; catalog: Catalog } | { ok: false; failures: CatalogFailure[] };

/** Lists every quiz under `dir`, sorted by path; fails if any quiz is invalid or none exists. */
export async function buildCatalog(dir: string): Promise<BuildResult> {
  const files = (await collectJsonFiles(dir))
    .filter((file) => basename(file) !== CATALOG_FILE)
    .map((file) => ({ file, src: relative(dir, file).split(sep).join("/") }))
    .sort((a, b) => (a.src < b.src ? -1 : a.src > b.src ? 1 : 0));

  const failures: CatalogFailure[] = [];
  const quizzes: Catalog["quizzes"] = [];
  for (const { file, src } of files) {
    const loaded = await loadJson(file);
    if (!loaded.ok) {
      failures.push({ file, errors: [{ path: "", message: loaded.message }] });
      continue;
    }
    const parsed = parseQuiz(loaded.data);
    if (parsed.ok) quizzes.push(catalogEntry(src, parsed.quiz));
    else failures.push({ file, errors: parsed.errors });
  }
  if (failures.length > 0) return { ok: false, failures };
  if (quizzes.length === 0)
    return {
      ok: false,
      failures: [
        {
          file: dir,
          errors: [{ path: "", message: "Keine Quiz-Dateien gefunden" }],
        },
      ],
    };
  return { ok: true, catalog: { catalog: CATALOG_VERSION, quizzes } };
}
