import { SCHEMA_VERSION, quizSchema, type Quiz } from "./schema.ts";

export interface FormatError {
  /** JSON path like `questions[3].answer`; empty for the document itself. */
  path: string;
  message: string;
}

export type ParseResult =
  { ok: true; quiz: Quiz } | { ok: false; errors: FormatError[] };

/** Validates an already JSON-parsed value as a quiz document. Reports all problems at once. */
export function parseQuiz(data: unknown): ParseResult {
  const version = (data as { schema?: unknown } | null)?.schema;
  if (typeof version === "number" && version !== SCHEMA_VERSION) {
    return {
      ok: false,
      errors: [
        {
          path: "schema",
          message: `Quiz-Format Version ${version} wird nicht unterstützt`,
        },
      ],
    };
  }

  const result = quizSchema.safeParse(data);
  if (result.success) return { ok: true, quiz: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: formatPath(issue.path),
      message: issue.message,
    })),
  };
}

export function formatPath(path: readonly PropertyKey[]): string {
  return path
    .map((key, i) =>
      typeof key === "number"
        ? `[${key}]`
        : `${i === 0 ? "" : "."}${String(key)}`,
    )
    .join("");
}
