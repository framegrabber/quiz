import { z } from "zod";
import { questionSchema } from "../question-types/definitions.ts";
import { idSchema, textSchema } from "./common.ts";
import { questionId } from "./questionId.ts";

export const SCHEMA_VERSION = 1;

const categorySchema = z.strictObject({
  id: idSchema,
  name: textSchema,
  description: textSchema.optional(),
});

export const quizSchema = z
  .strictObject({
    $schema: z.string().optional(),
    schema: z.literal(SCHEMA_VERSION),
    title: textSchema,
    description: textSchema.optional(),
    subject: textSchema.optional(),
    grade: z.int().min(5).max(13).optional(),
    source: textSchema.optional(),
    language: z
      .string()
      .regex(
        /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/,
        "Muss ein Sprachcode sein, z. B. en oder de",
      )
      .optional(),
    roundSize: z.int().positive().optional(),
    categories: z.array(categorySchema).min(1),
    questions: z.array(questionSchema).min(1),
  })
  .superRefine((quiz, ctx) => {
    const categoryIds = new Set<string>();
    quiz.categories.forEach((category, i) => {
      if (categoryIds.has(category.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["categories", i, "id"],
          message: `Kategorie-ID "${category.id}" kommt mehrfach vor`,
        });
      }
      categoryIds.add(category.id);
    });

    const used = new Set<string>();
    const seenIds = new Map<string, number>();
    quiz.questions.forEach((question, i) => {
      if (!categoryIds.has(question.category)) {
        ctx.addIssue({
          code: "custom",
          path: ["questions", i, "category"],
          message: `Kategorie "${question.category}" ist nicht in categories definiert`,
        });
      }
      used.add(question.category);

      const id = questionId(question);
      const first = seenIds.get(id);
      if (first !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: question.id ? ["questions", i, "id"] : ["questions", i],
          message: question.id
            ? `Fragen-ID "${id}" kommt mehrfach vor (zuerst bei questions[${first}])`
            : `Gleiche Frage wie questions[${first}]`,
        });
      } else {
        seenIds.set(id, i);
      }
    });

    quiz.categories.forEach((category, i) => {
      if (!used.has(category.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["categories", i],
          message: `Kategorie "${category.id}" enthält keine Fragen`,
        });
      }
    });
  });

export type Quiz = z.infer<typeof quizSchema>;
