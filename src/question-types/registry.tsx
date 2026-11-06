// UI side of the question types: components plus typed dispatch. The app uses this; the CLI uses definitions.ts.
import { choice, cloze, input, type Question } from "./definitions.ts";
import type { CheckResult } from "./types.ts";
import type { QuestionProps } from "./props.ts";
import { Choice } from "./choice/Choice.tsx";
import { Input } from "./input/Input.tsx";
import { Cloze } from "./cloze/Cloze.tsx";
import { clozeParts } from "./cloze/check.ts";

export type Answer = string | readonly string[];

export function checkAnswer(question: Question, answer: Answer): CheckResult {
  switch (question.type) {
    case "choice":
      return choice.check(question, answer as readonly string[]);
    case "input":
      return input.check(question, answer as string);
    case "cloze":
      return cloze.check(question, answer as readonly string[]);
  }
}

export function QuestionView(props: QuestionProps<Question, Answer>) {
  const { question } = props;
  switch (question.type) {
    case "choice":
      return (
        <Choice
          {...(props as QuestionProps<typeof question, readonly string[]>)}
        />
      );
    case "input":
      return <Input {...(props as QuestionProps<typeof question, string>)} />;
    case "cloze":
      return (
        <Cloze
          {...(props as QuestionProps<typeof question, readonly string[]>)}
        />
      );
  }
}

/** One-line label for lists (result screen). Cloze gaps show as ___. */
export function questionLabel(question: Question): string {
  if (question.type !== "cloze") return question.prompt;
  return clozeParts(question)
    .map((part) => (part.kind === "text" ? part.text : "___"))
    .join("");
}

/** Single choice submits on tap; everything else needs "Antwort abgeben" (or Return). */
export function submitsOnTap(question: Question): boolean {
  return question.type === "choice" && typeof question.answer === "string";
}
