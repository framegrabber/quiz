import { z } from "zod";
import { textSchema } from "./common.ts";
import { formatPath, type FormatError } from "./parse.ts";
import type { Quiz } from "./schema.ts";

export const CATALOG_VERSION = 1;

const catalogEntrySchema = z.strictObject({
  src: textSchema,
  title: textSchema,
  description: textSchema.optional(),
  subject: textSchema.optional(),
  grade: z.int().min(5).max(13).optional(),
  source: textSchema.optional(),
  questions: z.int().positive(),
});

export const catalogSchema = z.strictObject({
  catalog: z.literal(CATALOG_VERSION),
  quizzes: z.array(catalogEntrySchema).min(1),
});

export type Catalog = z.infer<typeof catalogSchema>;
export type CatalogEntry = z.infer<typeof catalogEntrySchema>;

export type CatalogParseResult =
  { ok: true; catalog: Catalog } | { ok: false; errors: FormatError[] };

/** A catalog is told apart from a quiz by its `catalog` version field. */
export function isCatalogDocument(data: unknown): boolean {
  return typeof data === "object" && data !== null && "catalog" in data;
}

export function parseCatalog(data: unknown): CatalogParseResult {
  const version = (data as { catalog?: unknown } | null)?.catalog;
  if (typeof version === "number" && version !== CATALOG_VERSION) {
    return {
      ok: false,
      errors: [
        {
          path: "catalog",
          message: `Katalog-Format Version ${version} wird nicht unterstützt`,
        },
      ],
    };
  }
  const result = catalogSchema.safeParse(data);
  if (result.success) return { ok: true, catalog: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: formatPath(issue.path),
      message: issue.message,
    })),
  };
}

/** The catalog entry for a valid quiz published at `src` (relative to the catalog). */
export function catalogEntry(src: string, quiz: Quiz): CatalogEntry {
  const { title, description, subject, grade, source } = quiz;
  return {
    src,
    title,
    ...(description && { description }),
    ...(subject && { subject }),
    ...(grade && { grade }),
    ...(source && { source }),
    questions: quiz.questions.length,
  };
}

export interface CatalogGroup<E> {
  label: string;
  entries: E[];
}

/** Groups entries by "subject · Jgst. grade · source", keeping catalog order. */
export function groupCatalog<E extends CatalogEntry>(
  entries: readonly E[],
): CatalogGroup<E>[] {
  const groups = new Map<string, E[]>();
  for (const entry of entries) {
    const label =
      [entry.subject, entry.grade && `Jgst. ${entry.grade}`, entry.source]
        .filter(Boolean)
        .join(" · ") || "Weitere Quizze";
    const group = groups.get(label);
    if (group) group.push(entry);
    else groups.set(label, [entry]);
  }
  return [...groups].map(([label, entries]) => ({ label, entries }));
}
