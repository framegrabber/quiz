// Single list of question types (schema + check, no UI). Used by format/ and the CLI.
import { z } from "zod";
import type { QuestionDefinition } from "./types.ts";
import { choiceSchema, type ChoiceQuestion } from "./choice/schema.ts";
import { checkChoice } from "./choice/check.ts";

export const choice: QuestionDefinition<ChoiceQuestion, readonly string[]> = {
  type: "choice",
  schema: choiceSchema,
  check: checkChoice,
};

export const questionSchema = z.discriminatedUnion("type", [choiceSchema]);

export type Question = z.infer<typeof questionSchema>;
