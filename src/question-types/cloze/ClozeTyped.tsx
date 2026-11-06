import { Fragment } from "preact";
import { useRef } from "preact/hooks";
import { answerInputAttributes } from "../../ui/answerInput.ts";
import type { QuestionProps } from "../props.ts";
import type { ClozePart } from "./parse.ts";
import type { ClozeQuestion } from "./schema.ts";
import { GapMark } from "./GapMark.tsx";
import styles from "./Cloze.module.css";

type Props = QuestionProps<ClozeQuestion, readonly string[]> & {
  parts: ClozePart[];
};

/** Brings the focused gap into view once the on-screen keyboard has resized the viewport. */
function revealAfterKeyboard(field: HTMLElement) {
  field.scrollIntoView({ block: "nearest" });
  window.visualViewport?.addEventListener(
    "resize",
    () => field.scrollIntoView({ block: "nearest" }),
    { once: true },
  );
}

/** One inline field per gap. Return moves to the next gap; on the last gap it bubbles to the Round. */
export function ClozeTyped({ parts, phase, result, onChange }: Props) {
  const gapCount = parts.filter((p) => p.kind === "gap").length;
  const values = useRef<string[]>(Array.from({ length: gapCount }, () => ""));
  const fields = useRef<(HTMLInputElement | null)[]>([]);

  const onInput = (g: number, value: string) => {
    values.current[g] = value;
    onChange(
      values.current.every((v) => v.trim()) ? [...values.current] : null,
    );
  };

  const onKeyDown = (g: number, event: KeyboardEvent) => {
    if (event.key !== "Enter" || g === gapCount - 1 || phase === "feedback")
      return;
    event.preventDefault();
    event.stopPropagation();
    fields.current[g + 1]?.focus();
  };

  let gapIndex = -1;
  return (
    <p class={`${styles.text} content`}>
      {parts.map((part, i) => {
        if (part.kind === "text")
          return <Fragment key={i}>{part.text}</Fragment>;
        const g = ++gapIndex;
        const longest = Math.max(...part.answers.map((a) => a.length));
        const correct = result?.parts?.[g];
        return (
          <span key={i} class={styles.typedGap}>
            <input
              {...answerInputAttributes}
              ref={(el) => {
                fields.current[g] = el;
              }}
              class={`text-input ${styles.gapInput}`}
              style={{ width: `${Math.max(longest, 3) + 3}ch` }}
              aria-label={`Lücke ${g + 1} von ${gapCount}`}
              enterKeyHint={g === gapCount - 1 ? "done" : "next"}
              readOnly={phase === "feedback"}
              data-state={
                result ? (correct ? "correct" : "incorrect") : undefined
              }
              onInput={(event) => onInput(g, event.currentTarget.value)}
              onKeyDown={(event) => onKeyDown(g, event)}
              onFocus={(event) => revealAfterKeyboard(event.currentTarget)}
            />
            {result && <GapMark correct={correct ?? false} />}
          </span>
        );
      })}
    </p>
  );
}
