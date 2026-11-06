import type { RoundSize } from "../engine/selectRound.ts";
import type { Quiz } from "../format/schema.ts";

export const DEFAULT_ROUND_SIZE = 10;
export const ROUND_SIZE_CHOICES: readonly RoundSize[] = [5, 10, 20, "all"];

/** Initial round size: link `n` > last choice for this quiz > quiz `roundSize` > 10. */
export function resolveRoundSize(
  fromLink: RoundSize | undefined,
  saved: RoundSize | undefined,
  quizDefault: number | undefined,
): RoundSize {
  return fromLink ?? saved ?? quizDefault ?? DEFAULT_ROUND_SIZE;
}

/** Categories from the link; `null` means all. Unknown ids are reported and the selection falls back to all. */
export function resolveCategories(
  fromLink: readonly string[] | undefined,
  quiz: Quiz,
): { selected: string[] | null; unknown: string[] } {
  if (!fromLink?.length) return { selected: null, unknown: [] };
  const known = new Set(quiz.categories.map((c) => c.id));
  const unknown = fromLink.filter((id) => !known.has(id));
  return unknown.length
    ? { selected: null, unknown }
    : { selected: [...fromLink], unknown };
}

/** The overview state as a hash, so the current URL is always the share link. */
export function buildHash(
  src: string,
  categories: readonly string[] | null,
  size: RoundSize,
): string {
  const params = new URLSearchParams({ src });
  if (categories?.length) params.set("cat", categories.join(","));
  params.set("n", String(size));
  return `#${params.toString()}`;
}
