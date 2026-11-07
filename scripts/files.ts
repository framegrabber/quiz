import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export const CATALOG_FILE = "catalog.json";

const IGNORED_FILES: Record<string, true> = {
  "package.json": true,
  "package-lock.json": true,
  "tsconfig.json": true,
};

const isUrl = (target: string) => /^https?:\/\//.test(target);

/** JSON files under a file, folder, or URL target; skips dotfiles and tooling files. */
export async function collectJsonFiles(target: string): Promise<string[]> {
  if (isUrl(target)) return [target];
  if (!(await stat(target)).isDirectory()) return [target];
  const files: string[] = [];
  for (const entry of await readdir(target, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const path = join(target, entry.name);
    if (entry.isDirectory()) files.push(...(await collectJsonFiles(path)));
    else if (entry.name.endsWith(".json") && !IGNORED_FILES[entry.name])
      files.push(path);
  }
  return files;
}

export async function loadText(source: string): Promise<string> {
  if (!isUrl(source)) return readFile(source, "utf8");
  const response = await fetch(source, { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

/** Parses JSON, turning syntax and load failures into one German message. */
export async function loadJson(
  source: string,
): Promise<{ ok: true; data: unknown } | { ok: false; message: string }> {
  try {
    return { ok: true, data: JSON.parse(await loadText(source)) };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof SyntaxError
          ? `Kein gültiges JSON: ${error.message}`
          : String(error),
    };
  }
}
