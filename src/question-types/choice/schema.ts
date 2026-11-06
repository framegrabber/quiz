import { z } from "zod";
import {
  hasDuplicates,
  questionBaseShape,
  textSchema,
} from "../../format/common.ts";

export const choiceSchema = z
  .strictObject({
    ...questionBaseShape,
    type: z.literal("choice"),
    prompt: textSchema,
    options: z.array(textSchema).min(2).max(8),
    answer: z.union([textSchema, z.array(textSchema).min(1)], {
      error: (issue) =>
        issue.input === undefined
          ? "Pflichtfeld fehlt"
          : "Muss ein Text oder eine Liste von Texten sein",
    }),
  })
  .superRefine((q, ctx) => {
    if (hasDuplicates(q.options)) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Optionen müssen eindeutig sein",
      });
    }
    const answers = typeof q.answer === "string" ? [q.answer] : q.answer;
    if (hasDuplicates(answers)) {
      ctx.addIssue({
        code: "custom",
        path: ["answer"],
        message: "Antworten müssen eindeutig sein",
      });
    }
    for (const answer of answers) {
      if (!q.options.includes(answer)) {
        ctx.addIssue({
          code: "custom",
          path: ["answer"],
          message: `"${answer}" ist nicht in options enthalten`,
        });
      }
    }
  });

export type ChoiceQuestion = z.infer<typeof choiceSchema>;
