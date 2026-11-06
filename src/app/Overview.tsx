import type { Quiz } from "../format/schema.ts";
import { Page } from "../ui/Page.tsx";
import styles from "./Overview.module.css";

interface OverviewProps {
  /** `null` while loading: renders a placeholder with the final structure. */
  quiz: Quiz | null;
  notices?: string[];
  onStart: () => void;
}

export function Overview({ quiz, notices = [], onStart }: OverviewProps) {
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
  const counts = new Map<string, number>();
  for (const q of quiz.questions)
    counts.set(q.category, (counts.get(q.category) ?? 0) + 1);

  return (
    <Page actions={start}>
      <header class={styles.header}>
        <h1>{quiz.title}</h1>
        {meta.length > 0 && <p class="text-muted">{meta.join(" · ")}</p>}
        {quiz.description && <p>{quiz.description}</p>}
      </header>
      {notices.map((notice) => (
        <p key={notice} class={styles.notice} role="status">
          {notice}
        </p>
      ))}
      <section class={styles.section} aria-labelledby="categories-title">
        <h2 id="categories-title">Kategorien</h2>
        <ul class={styles.categories}>
          {quiz.categories.map((category) => (
            <li key={category.id} class={styles.category}>
              <span>{category.name}</span>
              <span class="text-muted">
                {counts.get(category.id) ?? 0} Fragen
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}
