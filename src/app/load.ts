import { parseQuiz, type FormatError } from "../format/parse.ts";
import type { Quiz } from "../format/schema.ts";
import { parseCatalog, type CatalogEntry } from "../format/catalog.ts";
import { isAllowedSource } from "./hash.ts";

export type LoadError =
  | { kind: "http"; status: number }
  | { kind: "network" }
  | { kind: "timeout" }
  | { kind: "json" }
  | { kind: "invalid"; errors: FormatError[] };

export type LoadResult =
  { ok: true; quiz: Quiz } | { ok: false; error: LoadError };

/** A catalog entry whose `src` is resolved to an absolute, allowed quiz URL. */
export type ListedQuiz = CatalogEntry & { url: string };

export type CatalogLoadResult =
  { ok: true; quizzes: ListedQuiz[] } | { ok: false; error: LoadError };

export const LOAD_TIMEOUT_MS = 15_000;

interface LoadOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

async function loadJson(
  url: string,
  { fetchImpl = fetch, timeoutMs = LOAD_TIMEOUT_MS }: LoadOptions,
): Promise<{ ok: true; data: unknown } | { ok: false; error: LoadError }> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      cache: "no-cache",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "TimeoutError";
    return { ok: false, error: { kind: timedOut ? "timeout" : "network" } };
  }
  if (!response.ok)
    return { ok: false, error: { kind: "http", status: response.status } };

  try {
    return { ok: true, data: JSON.parse(await response.text()) };
  } catch {
    return { ok: false, error: { kind: "json" } };
  }
}

export async function loadQuiz(
  src: string,
  options: LoadOptions = {},
): Promise<LoadResult> {
  const loaded = await loadJson(src, options);
  if (!loaded.ok) return loaded;
  const parsed = parseQuiz(loaded.data);
  return parsed.ok
    ? { ok: true, quiz: parsed.quiz }
    : { ok: false, error: { kind: "invalid", errors: parsed.errors } };
}

/** Loads a catalog; entries whose quiz URL is not allowed as `src` are skipped. */
export async function loadCatalog(
  url: string,
  { dev = false, ...options }: LoadOptions & { dev?: boolean } = {},
): Promise<CatalogLoadResult> {
  const loaded = await loadJson(url, options);
  if (!loaded.ok) return loaded;
  const parsed = parseCatalog(loaded.data);
  if (!parsed.ok)
    return { ok: false, error: { kind: "invalid", errors: parsed.errors } };

  const quizzes: ListedQuiz[] = [];
  for (const entry of parsed.catalog.quizzes) {
    let resolved: string;
    try {
      resolved = new URL(entry.src, url).href;
    } catch {
      continue;
    }
    if (isAllowedSource(resolved, dev))
      quizzes.push({ ...entry, url: resolved });
  }
  return { ok: true, quizzes };
}
