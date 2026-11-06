// UI side of the question types: components plus typed dispatch. The app uses this; the CLI uses definitions.ts.
import { choice, input, type Question } from "./definitions.ts";
import type { CheckResult } from "./types.ts";
import type { QuestionProps } from "./props.ts";
import { Choice } from "./choice/Choice.tsx";
import { Input } from "./input/Input.tsx";

export type Answer = string | readonly string[];

/** Question types the UI can render. Widened as components land (cloze: T11). */
export type PlayableQuestion = Extract<Question, { type: "choice" | "input" }>;

export function isPlayable(question: Question): question is PlayableQuestion {
  return question.type === "choice" || question.type === "input";
}

export function checkAnswer(
  question: PlayableQuestion,
  answer: Answer,
): CheckResult {
  switch (question.type) {
    case "choice":
      return choice.check(question, answer as readonly string[]);
    case "input":
      return input.check(question, answer as string);
  }
}

export function QuestionView(props: QuestionProps<PlayableQuestion, Answer>) {
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
  }
}

/** One-line label for lists (result screen). */
export function questionLabel(question: PlayableQuestion): string {
  return question.prompt;
}

/** Single choice submits on tap; everything else needs "Antwort abgeben" (or Return). */
export function submitsOnTap(question: PlayableQuestion): boolean {
  return question.type === "choice" && typeof question.answer === "string";
}
