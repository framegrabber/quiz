import { z } from "zod";
import { questionBaseShape, textSchema } from "../../format/common.ts";
import { parseCloze } from "../cloze/parse.ts";

export const tableSchema = z
  .strictObject({
    ...questionBaseShape,
    type: z.literal("table"),
    prompt: textSchema.optional(),
    columns: z.array(textSchema).min(2).max(4),
    rows: z.array(z.array(z.string())).min(1).max(12),
    caseSensitive: z.boolean().optional(),
  })
  .superRefine((q, ctx) => {
    let gaps = 0;
    let cellErrors = false;
    q.rows.forEach((row, r) => {
      if (row.length !== q.columns.length) {
        ctx.addIssue({
          code: "custom",
          path: ["rows", r],
          message: `Zeile hat ${row.length} Zellen, erwartet ${q.columns.length} (eine pro Spalte)`,
        });
      }
      row.forEach((cell, c) => {
        const parsed = parseCloze(cell, { requireGap: false });
        if (parsed.ok) {
          gaps += parsed.parts.filter((p) => p.kind === "gap").length;
          return;
        }
        cellErrors = true;
        for (const error of parsed.errors) {
          ctx.addIssue({
            code: "custom",
            path: ["rows", r, c],
            message: `Zeichen ${error.index + 1}: ${error.message}`,
          });
        }
      });
    });
    if (gaps === 0 && !cellErrors) {
      ctx.addIssue({
        code: "custom",
        path: ["rows"],
        message: "Die Tabelle braucht mindestens eine Lücke",
      });
    }
  });

export type TableQuestion = z.infer<typeof tableSchema>;
