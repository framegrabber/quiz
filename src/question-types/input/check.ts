import { answersMatch } from "../../engine/normalize.ts";
import type { CheckResult } from "../types.ts";
import type { InputQuestion } from "./schema.ts";

export function checkInput(q: InputQuestion, given: string): CheckResult {
  const options = { caseSensitive: q.caseSensitive ?? false };
  const correct = [q.answer, ...(q.accept ?? [])].some((a) =>
    answersMatch(given, a, options),
  );
  return { correct, solution: q.answer };
}
