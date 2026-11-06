import { z } from "zod";
import { questionBaseShape, textSchema } from "../../format/common.ts";
import { parseCloze } from "./parse.ts";

export const clozeSchema = z
  .strictObject({
    ...questionBaseShape,
    type: z.literal("cloze"),
    prompt: textSchema.optional(),
    text: z.string(),
    mode: z.enum(["bank", "type"]).optional(),
    distractors: z.array(textSchema).min(1).optional(),
    caseSensitive: z.boolean().optional(),
  })
  .superRefine((q, ctx) => {
    const parsed = parseCloze(q.text);
    if (parsed.ok) return;
    for (const error of parsed.errors) {
      ctx.addIssue({
        code: "custom",
        path: ["text"],
        message: `Zeichen ${error.index + 1}: ${error.message}`,
      });
    }
  });

export type ClozeQuestion = z.infer<typeof clozeSchema>;
