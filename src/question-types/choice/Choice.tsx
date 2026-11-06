import { useMemo, useState } from "preact/hooks";
import { shuffle } from "../../engine/shuffle.ts";
import { CheckIcon, CrossIcon } from "../../ui/icons.tsx";
import { Prompt } from "../../ui/Prompt.tsx";
import type { QuestionProps } from "../props.ts";
import type { ChoiceQuestion } from "./schema.ts";
import styles from "./Choice.module.css";

export function Choice({
  question,
  phase,
  onChange,
  onSubmit,
}: QuestionProps<ChoiceQuestion, readonly string[]>) {
  const options = useMemo(() => shuffle(question.options), [question]);
  const answers =
    typeof question.answer === "string" ? [question.answer] : question.answer;
  const multi = Array.isArray(question.answer);
  const [selected, setSelected] = useState<string[]>([]);
  const done = phase === "feedback";

  const choose = (option: string) => {
    if (!multi) {
      setSelected([option]);
      onSubmit([option]);
      return;
    }
    const next = selected.includes(option)
      ? selected.filter((o) => o !== option)
      : [...selected, option];
    setSelected(next);
    onChange(next.length > 0 ? next : null);
  };

  return (
    <div class={styles.choice}>
      <Prompt text={question.prompt} />
      {multi && <p class="text-muted">Wähle alle richtigen Antworten.</p>}
      <div class={styles.options} role="group" aria-label="Antworten">
        {options.map((option) => {
          const isAnswer = answers.includes(option);
          const isSelected = selected.includes(option);
          const state =
            done && isAnswer
              ? "correct"
              : done && isSelected
                ? "incorrect"
                : undefined;
          return (
            <button
              key={option}
              type="button"
              class="option content"
              aria-pressed={multi ? isSelected : undefined}
              data-state={state}
              disabled={done}
              onClick={() => choose(option)}
            >
              {option}
              {state && (
                <span
                  class={`option-mark ${state === "correct" ? "text-correct" : "text-incorrect"}`}
                >
                  {state === "correct" ? <CheckIcon /> : <CrossIcon />}
                  <span class="visually-hidden">
                    {state === "correct"
                      ? "richtige Antwort"
                      : "deine Antwort, falsch"}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
