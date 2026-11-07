import { answersMatch } from "../../engine/normalize.ts";
import { parseCloze, type ClozePart } from "../cloze/parse.ts";
import type { CheckResult } from "../types.ts";
import type { TableQuestion } from "./schema.ts";

/** Parts per cell, row by row (validation guarantees every cell parses). */
export function tableCells(q: TableQuestion): ClozePart[][][] {
  return q.rows.map((row) =>
    row.map((cell) => {
      const parsed = parseCloze(cell, { requireGap: false });
      if (!parsed.ok)
        throw new Error(`Invalid table cell in a validated question: ${cell}`);
      return parsed.parts;
    }),
  );
}

/** Gaps in reading order: row by row, left to right. */
export function tableGaps(q: TableQuestion) {
  return tableCells(q)
    .flat(2)
    .filter((part) => part.kind === "gap");
}

/** `given` holds one answer per gap in reading order. Correct iff every gap is correct. */
export function checkTable(
  q: TableQuestion,
  given: readonly string[],
): CheckResult {
  const options = { caseSensitive: q.caseSensitive ?? false };
  const gaps = tableGaps(q);
  const results = gaps.map((gap, i) =>
    gap.answers.some((answer) => answersMatch(given[i] ?? "", answer, options)),
  );
  return {
    correct: results.every(Boolean),
    solution: gaps.map((gap) => gap.answers[0]).join(" · "),
    parts: results,
    inlineSolution: true,
  };
}
