import type { z } from "zod";

export interface CheckResult {
  correct: boolean;
  /** Human-readable correct answer, shown in feedback. */
  solution: string;
  /** Per-part correctness, e.g. per cloze gap. */
  parts?: boolean[];
  /** The question shows the correct answer per part itself (table); the action bar then omits "Lösung". */
  inlineSolution?: true;
}

/** Non-UI part of a question type: used by the format validator and the CLI (no Preact imports). */
export interface QuestionDefinition<Q extends { type: string }, A> {
  type: Q["type"];
  schema: z.ZodType<Q>;
  check(question: Q, answer: A): CheckResult;
}
