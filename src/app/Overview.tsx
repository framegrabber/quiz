import { countMastered, type QuizProgress } from "../engine/mastery.ts";
import type { RoundSize } from "../engine/selectRound.ts";
import type { Quiz } from "../format/schema.ts";
import { Page } from "../ui/Page.tsx";
import { CategoryPicker, RoundSizePicker } from "./OverviewControls.tsx";
import { ShareLink } from "./ShareLink.tsx";
import styles from "./Overview.module.css";

interface OverviewProps {
  quiz: Quiz;
  progress: QuizProgress;
  /** Selected category ids; `null` = all. */
  selected: readonly string[] | null;
  size: RoundSize;
  notices: string[];
  onSelectedChange: (selected: string[] | null) => void;
  onSizeChange: (size: RoundSize) => void;
  onStart: () => void;
}

export function Overview(props: OverviewProps) {
  const { quiz, progress, selected } = props;
  const meta = [
    quiz.subject,
    quiz.grade && `Jgst. ${quiz.grade}`,
    quiz.source,
  ].filter(Boolean);
  const pool = selected
    ? quiz.questions.filter((q) => selected.includes(q.category))
    : quiz.questions;
  const allMastered =
    pool.length > 0 && countMastered(pool, progress) === pool.length;

  return (
    <Page
      actions={
        <>
          <button
            type="button"
            class="btn btn-primary btn-block"
            onClick={props.onStart}
          >
            Starten
          </button>
          <ShareLink title={quiz.title} />
        </>
      }
    >
      <a class={styles.back} href="#">
        ‹ Meine Quizze
      </a>
      <header class={styles.header}>
        <h1>{quiz.title}</h1>
        {meta.length > 0 && <p class="text-muted">{meta.join(" · ")}</p>}
        {quiz.description && <p>{quiz.description}</p>}
      </header>
      {props.notices.map((notice) => (
        <p key={notice} class={styles.notice} role="status">
          {notice}
        </p>
      ))}
      {allMastered && (
        <p class={styles.allMastered} role="status">
          Alles gemeistert! Eine neue Runde wiederholt die Fragen.
        </p>
      )}
      <CategoryPicker
        quiz={quiz}
        progress={progress}
        selected={selected}
        onChange={props.onSelectedChange}
      />
      <RoundSizePicker value={props.size} onChange={props.onSizeChange} />
    </Page>
  );
}

/** Loading state: the overview's structure without content (no layout shift, no spinner). */
export function OverviewPlaceholder() {
  return (
    <Page
      busy
      actions={
        <button type="button" class="btn btn-primary btn-block" disabled>
          Starten
        </button>
      }
    >
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
