import type { CheckResult } from "../types.ts";
import type { ChoiceQuestion } from "./schema.ts";

/** Correct iff the selected set equals the answer set (single choice: exactly the one answer). */
export function checkChoice(
  q: ChoiceQuestion,
  selected: readonly string[],
): CheckResult {
  const answers = typeof q.answer === "string" ? [q.answer] : q.answer;
  const chosen = new Set(selected);
  const correct =
    chosen.size === answers.length && answers.every((a) => chosen.has(a));
  return { correct, solution: answers.join(", ") };
}
