import { useLayoutEffect, useRef, useState } from "preact/hooks";
import {
  QuestionView,
  checkAnswer,
  submitsOnTap,
  type Answer,
  type PlayableQuestion,
} from "../../question-types/registry.tsx";
import type { CheckResult } from "../../question-types/types.ts";
import { RoundLayout } from "../../ui/RoundLayout.tsx";
import { CrossIcon } from "../../ui/icons.tsx";
import { ActionBar } from "./ActionBar.tsx";
import styles from "./Round.module.css";

export interface AnsweredQuestion {
  question: PlayableQuestion;
  result: CheckResult;
}

interface RoundProps {
  questions: PlayableQuestion[];
  /** Language of the quiz content (`lang` on the question area). */
  language?: string;
  onAnswer?: (answered: AnsweredQuestion) => void;
  onFinish: (answered: AnsweredQuestion[]) => void;
  onExit: () => void;
}

const isTextField = (el: Element | null): el is HTMLInputElement =>
  el instanceof HTMLInputElement && el.type === "text";

/**
 * Plays a list of questions. Owns the action bar, scoring, and focus; question components only
 * render the question and report answers. Focus rules: docs/design.md "Keeping the keyboard open".
 */
export function Round({
  questions,
  language,
  onAnswer,
  onFinish,
  onExit,
}: RoundProps) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const question = questions[index]!;
  const isLast = index === questions.length - 1;

  // New question: focus its first control right after render, still inside the user's tap/keypress.
  useLayoutEffect(() => {
    const first =
      contentRef.current?.querySelector<HTMLElement>("input, button");
    first?.focus({ preventScroll: true });
  }, [index]);

  // Feedback: a text field keeps focus (keyboard stays open); otherwise focus moves to "Weiter".
  useLayoutEffect(() => {
    if (result && !isTextField(document.activeElement))
      nextRef.current?.focus();
  }, [result]);

  const submit = (given: Answer) => {
    if (result) return;
    const checked = checkAnswer(question, given);
    const entry = { question, result: checked };
    setResult(checked);
    setAnswered([...answered, entry]);
    onAnswer?.(entry);
  };

  const next = () => {
    if (isLast) {
      onFinish(answered);
      return;
    }
    setIndex(index + 1);
    setAnswer(null);
    setResult(null);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" || !isTextField(event.target as Element)) return;
    event.preventDefault();
    if (result) next();
    else if (answer !== null) submit(answer);
  };

  return (
    <RoundLayout
      header={
        <>
          <button
            type="button"
            class={styles.exit}
            onClick={onExit}
            aria-label="Runde beenden"
          >
            <CrossIcon />
          </button>
          <h1 class={styles.title}>
            <span class="visually-hidden">Frage </span>
            {index + 1} / {questions.length}
          </h1>
          <progress
            class={styles.progress}
            max={questions.length}
            value={index + (result ? 1 : 0)}
            aria-label="Fortschritt"
          />
        </>
      }
      actions={
        <ActionBar
          result={result}
          canSubmit={answer !== null}
          submitsOnTap={submitsOnTap(question)}
          isLast={isLast}
          nextRef={nextRef}
          onSubmit={() => answer !== null && submit(answer)}
          onNext={next}
        />
      }
    >
      <div
        ref={contentRef}
        class={styles.question}
        lang={language}
        onKeyDown={onKeyDown}
      >
        <QuestionView
          key={index}
          question={question}
          phase={result ? "feedback" : "answering"}
          result={result ?? undefined}
          onChange={setAnswer}
          onSubmit={submit}
        />
        {result && question.explanation && (
          <p class={styles.explanation} lang="de">
            {question.explanation}
          </p>
        )}
      </div>
    </RoundLayout>
  );
}
