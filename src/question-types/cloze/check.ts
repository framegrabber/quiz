import { answersMatch } from "../../engine/normalize.ts";
import type { CheckResult } from "../types.ts";
import { parseCloze, type ClozePart } from "./parse.ts";
import type { ClozeQuestion } from "./schema.ts";

/** Parts of a validated cloze question (validation guarantees the text parses). */
export function clozeParts(q: ClozeQuestion): ClozePart[] {
  const parsed = parseCloze(q.text);
  if (!parsed.ok)
    throw new Error(`Invalid cloze text in a validated question: ${q.text}`);
  return parsed.parts;
}

/** `given` holds one answer per gap, in order. Correct iff every gap is correct. */
export function checkCloze(
  q: ClozeQuestion,
  given: readonly string[],
): CheckResult {
  const options = { caseSensitive: q.caseSensitive ?? false };
  const parts = clozeParts(q);
  const gaps = parts.filter((p) => p.kind === "gap");
  const results = gaps.map((gap, i) =>
    gap.answers.some((answer) => answersMatch(given[i] ?? "", answer, options)),
  );
  const solution = parts
    .map((p) => (p.kind === "text" ? p.text : p.answers[0]))
    .join("");
  return { correct: results.every(Boolean), solution, parts: results };
}
