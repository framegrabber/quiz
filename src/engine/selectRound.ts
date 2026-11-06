import { questionId } from "../format/questionId.ts";
import type { Question } from "../question-types/definitions.ts";
import type { QuizProgress } from "./mastery.ts";
import { shuffle, type Rng } from "./shuffle.ts";

export type RoundSize = number | "all";

/**
 * Picks the questions for a round: lowest box first, then least recently seen (never seen first).
 * Mastered questions only fill up when there are not enough others. Ties are broken randomly,
 * and the picked questions are shuffled.
 */
export function selectRound(
  pool: readonly Question[],
  progress: QuizProgress,
  size: RoundSize,
  rng: Rng = Math.random,
): Question[] {
  const count = size === "all" ? pool.length : Math.min(size, pool.length);
  const rank = (q: Question) => {
    const p = progress[questionId(q)];
    return { box: p?.box ?? 0, lastSeen: p?.lastSeen ?? -Infinity };
  };
  const ordered = shuffle(pool, rng).sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    return ra.box - rb.box || ra.lastSeen - rb.lastSeen;
  });
  return shuffle(ordered.slice(0, count), rng);
}
