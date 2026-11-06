// UI side of the question types: components plus typed dispatch. The app uses this; the CLI uses definitions.ts.
import { choice, type Question } from "./definitions.ts";
import type { CheckResult } from "./types.ts";
import type { QuestionProps } from "./props.ts";
import { Choice } from "./choice/Choice.tsx";

export type Answer = string | readonly string[];

/** Question types the UI can render. Widened as components land (input: T10, cloze: T11). */
export type PlayableQuestion = Extract<Question, { type: "choice" }>;

export function isPlayable(question: Question): question is PlayableQuestion {
  return question.type === "choice";
}

export function checkAnswer(
  question: PlayableQuestion,
  answer: Answer,
): CheckResult {
  switch (question.type) {
    case "choice":
      return choice.check(question, answer as readonly string[]);
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
  }
}

/** One-line label for lists (result screen). */
export function questionLabel(question: PlayableQuestion): string {
  return question.prompt;
}

/** Single choice submits on tap; everything else needs "Antwort abgeben". */
export function submitsOnTap(question: PlayableQuestion): boolean {
  return question.type === "choice" && typeof question.answer === "string";
}
