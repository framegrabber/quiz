// Single list of question types (schema + check, no UI). Used by format/ and the CLI.
import { z } from "zod";
import type { QuestionDefinition } from "./types.ts";
import { choiceSchema, type ChoiceQuestion } from "./choice/schema.ts";
import { checkChoice } from "./choice/check.ts";
import { inputSchema, type InputQuestion } from "./input/schema.ts";
import { checkInput } from "./input/check.ts";
import { clozeSchema, type ClozeQuestion } from "./cloze/schema.ts";
import { checkCloze } from "./cloze/check.ts";

export const choice: QuestionDefinition<ChoiceQuestion, readonly string[]> = {
  type: "choice",
  schema: choiceSchema,
  check: checkChoice,
};

export const input: QuestionDefinition<InputQuestion, string> = {
  type: "input",
  schema: inputSchema,
  check: checkInput,
};

export const cloze: QuestionDefinition<ClozeQuestion, readonly string[]> = {
  type: "cloze",
  schema: clozeSchema,
  check: checkCloze,
};

const questionSchemas = [choiceSchema, inputSchema, clozeSchema] as const;

export const questionSchema = z.discriminatedUnion("type", questionSchemas, {
  error: (issue) =>
    issue.code === "invalid_union"
      ? `Unbekannter Fragetyp. Erlaubt: ${questionSchemas.map((s) => s.shape.type.value).join(", ")}`
      : undefined,
});

export type Question = z.infer<typeof questionSchema>;
