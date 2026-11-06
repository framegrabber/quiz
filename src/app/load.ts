import { parseQuiz, type FormatError } from "../format/parse.ts";
import type { Quiz } from "../format/schema.ts";

export type LoadError =
  | { kind: "http"; status: number }
  | { kind: "network" }
  | { kind: "timeout" }
  | { kind: "json" }
  | { kind: "invalid"; errors: FormatError[] };

export type LoadResult =
  { ok: true; quiz: Quiz } | { ok: false; error: LoadError };

export const LOAD_TIMEOUT_MS = 15_000;

export async function loadQuiz(
  src: string,
  { fetchImpl = fetch, timeoutMs = LOAD_TIMEOUT_MS } = {},
): Promise<LoadResult> {
  let response: Response;
  try {
    response = await fetchImpl(src, {
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

  let data: unknown;
  try {
    data = JSON.parse(await response.text());
  } catch {
    return { ok: false, error: { kind: "json" } };
  }

  const parsed = parseQuiz(data);
  return parsed.ok
    ? { ok: true, quiz: parsed.quiz }
    : { ok: false, error: { kind: "invalid", errors: parsed.errors } };
}
