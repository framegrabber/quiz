import { useLayoutEffect, useRef } from "preact/hooks";
import { questionLabel } from "../question-types/registry.tsx";
import { Page } from "../ui/Page.tsx";
import type { AnsweredQuestion } from "./round/Round.tsx";
import styles from "./Result.module.css";

interface ResultProps {
  answered: AnsweredQuestion[];
  language?: string;
  onAgain: () => void;
  onOverview: () => void;
}

export function Result({
  answered,
  language,
  onAgain,
  onOverview,
}: ResultProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const correct = answered.filter((a) => a.result.correct).length;
  const mistakes = answered.filter((a) => !a.result.correct);

  useLayoutEffect(() => headingRef.current?.focus(), []);

  return (
    <Page
      actions={
        <>
          <button
            type="button"
            class="btn btn-primary btn-block"
            onClick={onAgain}
          >
            Neue Runde
          </button>
          <button
            type="button"
            class="btn btn-secondary btn-block"
            onClick={onOverview}
          >
            Zur Übersicht
          </button>
        </>
      }
    >
      <header class={styles.header}>
        <h1 ref={headingRef} tabIndex={-1} class={styles.title}>
          Ergebnis
        </h1>
        <p class={styles.score}>
          {correct} / {answered.length} richtig
        </p>
      </header>
      {mistakes.length === 0 ? (
        <p class={styles.perfect}>Alles richtig – stark!</p>
      ) : (
        <section class={styles.section} aria-labelledby="mistakes-title">
          <h2 id="mistakes-title">Noch üben</h2>
          <ul class={styles.mistakes}>
            {mistakes.map(({ question, result }, i) => (
              <li key={i} class={styles.mistake}>
                <span class="content" lang={language}>
                  {questionLabel(question)}
                </span>
                <span>
                  Lösung:{" "}
                  <strong class="content" lang={language}>
                    {result.solution}
                  </strong>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  );
}
