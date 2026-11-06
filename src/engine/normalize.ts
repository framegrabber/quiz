export interface NormalizeOptions {
  caseSensitive?: boolean;
}

// Apostrophe look-alikes produced by iOS smart punctuation and other keyboards.
const APOSTROPHES = /[’‘‛´`]/g;

/** SPEC "Answer normalization": NFC, apostrophes, whitespace, case. Nothing else. */
export function normalize(
  value: string,
  { caseSensitive = false }: NormalizeOptions = {},
): string {
  const result = value
    .normalize("NFC")
    .replace(APOSTROPHES, "'")
    .trim()
    .replace(/\s+/g, " ");
  return caseSensitive ? result : result.toLowerCase();
}

export function answersMatch(
  given: string,
  expected: string,
  options?: NormalizeOptions,
): boolean {
  return normalize(given, options) === normalize(expected, options);
}
