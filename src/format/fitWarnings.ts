import { clozeParts } from "../question-types/cloze/check.ts";
import type { FormatError } from "./parse.ts";
import type { Quiz } from "./schema.ts";

/** Limits under which a question fits an iPhone SE screen without scrolling (SPEC "Mobile layout"). */
export const FIT_LIMITS = {
  promptChars: 120,
  choiceOptions: 4,
  clozeChars: 160,
  clozeGaps: 4,
  bankWords: 8,
  tableColumns: 3,
  tableRows: 6,
} as const;

/** Warnings for content that is valid but will need scrolling on small phones. */
export function fitWarnings(quiz: Quiz): FormatError[] {
  const warnings: FormatError[] = [];
  const warn = (path: string, message: string) =>
    warnings.push({ path, message });

  quiz.questions.forEach((q, i) => {
    const at = `questions[${i}]`;
    if (q.prompt && q.prompt.length > FIT_LIMITS.promptChars) {
      warn(
        `${at}.prompt`,
        `${q.prompt.length} Zeichen (empfohlen ≤ ${FIT_LIMITS.promptChars})`,
      );
    }
    if (q.type === "choice" && q.options.length > FIT_LIMITS.choiceOptions) {
      warn(
        `${at}.options`,
        `${q.options.length} Optionen (empfohlen ≤ ${FIT_LIMITS.choiceOptions})`,
      );
    }
    if (q.type === "cloze") {
      const parts = clozeParts(q);
      const gaps = parts.filter((p) => p.kind === "gap");
      const shown = parts
        .map((p) => (p.kind === "text" ? p.text : p.answers[0]))
        .join("");
      if (shown.length > FIT_LIMITS.clozeChars) {
        warn(
          `${at}.text`,
          `${shown.length} Zeichen (empfohlen ≤ ${FIT_LIMITS.clozeChars})`,
        );
      }
      if (gaps.length > FIT_LIMITS.clozeGaps) {
        warn(
          `${at}.text`,
          `${gaps.length} Lücken (empfohlen ≤ ${FIT_LIMITS.clozeGaps})`,
        );
      }
      const bank = gaps.length + (q.distractors?.length ?? 0);
      if ((q.mode ?? "bank") === "bank" && bank > FIT_LIMITS.bankWords) {
        warn(
          `${at}`,
          `${bank} Wörter in der Wortbank (empfohlen ≤ ${FIT_LIMITS.bankWords})`,
        );
      }
    }
    if (q.type === "table") {
      if (q.columns.length > FIT_LIMITS.tableColumns) {
        warn(
          `${at}.columns`,
          `${q.columns.length} Spalten (empfohlen ≤ ${FIT_LIMITS.tableColumns})`,
        );
      }
      if (q.rows.length > FIT_LIMITS.tableRows) {
        warn(
          `${at}.rows`,
          `${q.rows.length} Zeilen (empfohlen ≤ ${FIT_LIMITS.tableRows})`,
        );
      }
    }
  });

  return warnings;
}
