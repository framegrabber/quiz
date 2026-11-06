import type { CheckResult } from "./types.ts";

/** Contract between the Round and a question component (SPEC "Code Style"). */
export interface QuestionProps<Q, A> {
  question: Q;
  phase: "answering" | "feedback";
  /** Set in "feedback". */
  result?: CheckResult;
  /** Complete answer, or null while incomplete (enables/disables "Antwort abgeben"). */
  onChange(answer: A | null): void;
  /** Submit immediately (single-choice tap). Return in a text field bubbles to the Round instead. */
  onSubmit(answer: A): void;
}
