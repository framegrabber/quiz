import type { Ref } from "preact";
import type { CheckResult } from "../../question-types/types.ts";
import { keepFocus } from "../../ui/RoundLayout.tsx";
import { CheckIcon, CrossIcon } from "../../ui/icons.tsx";
import styles from "./Round.module.css";

interface ActionBarProps {
  result: CheckResult | null;
  /** True when the current answer is complete. */
  canSubmit: boolean;
  submitsOnTap: boolean;
  isLast: boolean;
  nextRef: Ref<HTMLButtonElement>;
  onSubmit: () => void;
  onNext: () => void;
}

/** Feedback (always-present live region) plus the primary button. Buttons never take focus from a text field. */
export function ActionBar(props: ActionBarProps) {
  const { result } = props;
  return (
    <>
      <div class={styles.feedback} aria-live="polite">
        {result && (
          <p
            class={`${styles.feedbackLine} ${result.correct ? "text-correct" : "text-incorrect"}`}
          >
            {result.correct ? <CheckIcon /> : <CrossIcon />}
            <strong>{result.correct ? "Richtig" : "Falsch"}</strong>
            {!result.correct && !result.inlineSolution && (
              <span class={styles.solution}>
                Lösung: <span class="content">{result.solution}</span>
              </span>
            )}
          </p>
        )}
      </div>
      {result ? (
        <button
          key="next"
          ref={props.nextRef}
          type="button"
          class="btn btn-primary btn-block"
          onMouseDown={keepFocus}
          onClick={props.onNext}
        >
          {props.isLast ? "Ergebnis anzeigen" : "Weiter"}
        </button>
      ) : props.submitsOnTap ? (
        <p class="text-muted">Tippe auf eine Antwort.</p>
      ) : (
        <button
          type="button"
          class="btn btn-primary btn-block"
          key="submit"
          disabled={!props.canSubmit}
          onMouseDown={keepFocus}
          onClick={props.onSubmit}
        >
          Antwort abgeben
        </button>
      )}
    </>
  );
}
