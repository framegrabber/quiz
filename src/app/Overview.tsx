import { countMastered, type QuizProgress } from "../engine/mastery.ts";
import type { Quiz } from "../format/schema.ts";
import { Page } from "../ui/Page.tsx";
import styles from "./Overview.module.css";

interface OverviewProps {
  /** `null` while loading: renders a placeholder with the final structure. */
  quiz: Quiz | null;
  progress?: QuizProgress;
  /** Selected category ids; `null` = all. */
  selected?: readonly string[] | null;
  notices?: string[];
  onStart: () => void;
}

export function Overview({
  quiz,
  progress = {},
  selected = null,
  notices = [],
  onStart,
}: OverviewProps) {
  const start = (
    <button
      type="button"
      class="btn btn-primary btn-block"
      disabled={!quiz}
      onClick={onStart}
    >
      Starten
    </button>
  );

  if (!quiz) {
    return (
      <Page actions={start} busy>
        <h1 class={styles.placeholder}>
          <span class="visually-hidden">Quiz wird geladen …</span>
        </h1>
        <p
          class={`${styles.placeholder} ${styles.placeholderShort}`}
          aria-hidden="true"
        />
        <ul class={styles.categories} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} class={`${styles.category} ${styles.placeholder}`} />
          ))}
        </ul>
      </Page>
    );
  }

  const meta = [
    quiz.subject,
    quiz.grade && `Jgst. ${quiz.grade}`,
    quiz.source,
  ].filter(Boolean);
  const pool = selected
    ? quiz.questions.filter((q) => selected.includes(q.category))
    : quiz.questions;
  const masteredInPool = countMastered(pool, progress);
  const masteredTotal = countMastered(quiz.questions, progress);

  return (
    <Page actions={start}>
      <header class={styles.header}>
        <h1>{quiz.title}</h1>
        {meta.length > 0 && <p class="text-muted">{meta.join(" · ")}</p>}
        {quiz.description && <p>{quiz.description}</p>}
        <p>
          <strong>
            {masteredTotal} / {quiz.questions.length}
          </strong>{" "}
          gemeistert
        </p>
      </header>
      {notices.map((notice) => (
        <p key={notice} class={styles.notice} role="status">
          {notice}
        </p>
      ))}
      {pool.length > 0 && masteredInPool === pool.length && (
        <p class={styles.allMastered} role="status">
          Alles gemeistert! Eine neue Runde wiederholt die Fragen.
        </p>
      )}
      <section class={styles.section} aria-labelledby="categories-title">
        <h2 id="categories-title">Kategorien</h2>
        <ul class={styles.categories}>
          {quiz.categories.map((category) => {
            const questions = quiz.questions.filter(
              (q) => q.category === category.id,
            );
            return (
              <li key={category.id} class={styles.category}>
                <span>{category.name}</span>
                <span class="text-muted">
                  {countMastered(questions, progress)} / {questions.length}
                  <span class="visually-hidden"> gemeistert</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </Page>
  );
}
