import { answerInputAttributes } from "../../ui/answerInput.ts";
import { Prompt } from "../../ui/Prompt.tsx";
import type { QuestionProps } from "../props.ts";
import type { InputQuestion } from "./schema.ts";
import styles from "./Input.module.css";

/** Typed answer. Return bubbles to the Round (submit / continue); the field stays focused in feedback. */
export function Input({
  question,
  phase,
  result,
  onChange,
}: QuestionProps<InputQuestion, string>) {
  return (
    <div class={styles.input}>
      <Prompt text={question.prompt} />
      <input
        {...answerInputAttributes}
        class="text-input content"
        aria-label="Deine Antwort"
        enterKeyHint="done"
        readOnly={phase === "feedback"}
        data-state={
          result ? (result.correct ? "correct" : "incorrect") : undefined
        }
        onInput={(event) => {
          const value = event.currentTarget.value;
          onChange(value.trim() ? value : null);
        }}
      />
    </div>
  );
}
