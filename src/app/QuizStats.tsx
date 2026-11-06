import type { QuizProgress } from "../engine/mastery.ts";
import { accuracy, missedQuestions, tally } from "../engine/stats.ts";
import type { Quiz } from "../format/schema.ts";
import type { Question } from "../question-types/definitions.ts";
import { questionLabel } from "../question-types/registry.tsx";
import styles from "./Stats.module.css";

const MAX_MISSED = 5;
const percent = (value: number | null) => (value === null ? "–" : `${value} %`);

interface QuizStatsProps {
  quiz: Quiz;
  /** Questions of the current category selection. */
  pool: readonly Question[];
  progress: QuizProgress;
  rounds: number;
  onPracticeMistakes: () => void;
}

/** Accuracy, rounds, answers, and most-missed questions for the current selection. */
export function QuizStats({
  quiz,
  pool,
  progress,
  rounds,
  onPracticeMistakes,
}: QuizStatsProps) {
  const overall = tally(pool, progress);
  const missed = missedQuestions(pool, progress);
  const categories = quiz.categories.filter((c) =>
    pool.some((q) => q.category === c.id),
  );

  return (
    <section class={styles.section} aria-labelledby="stats-title">
      <h2 id="stats-title">Statistik</h2>
      <dl class={styles.figures}>
        <div>
          <dt>Trefferquote</dt>
          <dd>{percent(accuracy(overall))}</dd>
        </div>
        <div>
          <dt>Runden</dt>
          <dd>{rounds}</dd>
        </div>
        <div>
          <dt>Antworten</dt>
          <dd>{overall.answers}</dd>
        </div>
      </dl>
      {categories.length > 1 && (
        <ul class={styles.rows} aria-label="Trefferquote je Kategorie">
          {categories.map((category) => {
            const questions = pool.filter((q) => q.category === category.id);
            return (
              <li key={category.id}>
                <span>{category.name}</span>
                <span>{percent(accuracy(tally(questions, progress)))}</span>
              </li>
            );
          })}
        </ul>
      )}
      {missed.length > 0 && (
        <>
          <h3 class={styles.subtitle}>Häufigste Fehler</h3>
          <ol class={styles.rows}>
            {missed.slice(0, MAX_MISSED).map(({ question, wrong }, i) => (
              <li key={i}>
                <span class="content" lang={quiz.language}>
                  {questionLabel(question)}
                </span>
                <span class="text-incorrect">{wrong}× falsch</span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            class="btn btn-secondary btn-block"
            onClick={onPracticeMistakes}
          >
            Fehler üben ({missed.length})
          </button>
        </>
      )}
    </section>
  );
}
