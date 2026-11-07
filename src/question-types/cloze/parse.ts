export type ClozePart =
  { kind: "text"; text: string } | { kind: "gap"; answers: string[] };

export interface ClozeError {
  /** 0-based character position in the source text. */
  index: number;
  message: string;
}

export type ClozeParseResult =
  { ok: true; parts: ClozePart[] } | { ok: false; errors: ClozeError[] };

/**
 * Parses cloze text: gaps are `{answer}` or `{answer|alt|alt}`; `\{` and `\}` are literal braces.
 * Reports every error it finds instead of stopping at the first. Table cells pass
 * `requireGap: false` because plain text cells are allowed.
 */
export function parseCloze(
  source: string,
  { requireGap = true }: { requireGap?: boolean } = {},
): ClozeParseResult {
  const parts: ClozePart[] = [];
  const errors: ClozeError[] = [];
  let text = "";
  let gap: { start: number; raw: string } | null = null;

  for (let i = 0; i < source.length; i++) {
    const char = source[i]!;
    const next = source[i + 1];

    if (char === "\\" && (next === "{" || next === "}")) {
      if (gap) gap.raw += next;
      else text += next;
      i++;
      continue;
    }

    if (char === "{") {
      if (gap) {
        errors.push({
          index: i,
          message: "Lücken dürfen nicht verschachtelt sein",
        });
        continue;
      }
      if (text) parts.push({ kind: "text", text });
      text = "";
      gap = { start: i, raw: "" };
      continue;
    }

    if (char === "}") {
      if (!gap) {
        errors.push({ index: i, message: "} ohne öffnende {" });
        continue;
      }
      const answers = gap.raw.split("|").map((a) => a.trim());
      if (gap.raw.trim() === "") {
        errors.push({ index: gap.start, message: "Lücke ohne Antwort" });
      } else if (answers.some((a) => a === "")) {
        errors.push({
          index: gap.start,
          message: "Lücke mit leerer Alternative",
        });
      }
      parts.push({ kind: "gap", answers });
      gap = null;
      continue;
    }

    if (gap) gap.raw += char;
    else text += char;
  }

  if (gap)
    errors.push({ index: gap.start, message: "Lücke ohne schließende }" });
  if (text) parts.push({ kind: "text", text });
  if (
    requireGap &&
    !parts.some((p) => p.kind === "gap") &&
    errors.length === 0
  ) {
    errors.push({ index: 0, message: "Der Text enthält keine Lücke" });
  }

  return errors.length ? { ok: false, errors } : { ok: true, parts };
}
