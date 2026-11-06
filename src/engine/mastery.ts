import { questionId } from "../format/questionId.ts";
import type { Question } from "../question-types/definitions.ts";

/** Box 0–3 (Leitner). Correct moves up one box, wrong drops to 0. Box 3 = mastered. */
export const MASTERED_BOX = 3;

export interface QuestionProgress {
  box: number;
  right: number;
  wrong: number;
  /** Epoch milliseconds of the last answer. */
  lastSeen: number;
}

export type QuizProgress = Record<string, QuestionProgress>;

export function applyAnswer(
  previous: QuestionProgress | undefined,
  correct: boolean,
  now: number,
): QuestionProgress {
  const current = previous ?? { box: 0, right: 0, wrong: 0, lastSeen: 0 };
  return correct
    ? {
        box: Math.min(current.box + 1, MASTERED_BOX),
        right: current.right + 1,
        wrong: current.wrong,
        lastSeen: now,
      }
    : { box: 0, right: current.right, wrong: current.wrong + 1, lastSeen: now };
}

export function isMastered(progress: QuestionProgress | undefined): boolean {
  return (progress?.box ?? 0) >= MASTERED_BOX;
}

export function countMastered(
  questions: readonly Question[],
  progress: QuizProgress,
): number {
  return questions.filter((q) => isMastered(progress[questionId(q)])).length;
}
