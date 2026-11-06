import { countMastered, type QuizProgress } from "../engine/mastery.ts";
import type { RoundSize } from "../engine/selectRound.ts";
import type { Quiz } from "../format/schema.ts";
import { ROUND_SIZE_CHOICES } from "./roundSettings.ts";
import styles from "./Overview.module.css";

interface CategoryPickerProps {
  quiz: Quiz;
  progress: QuizProgress;
  /** `null` = all categories. */
  selected: readonly string[] | null;
  onChange: (selected: string[] | null) => void;
}

/** Toggle categories; selecting none or every category means "Alle". */
export function CategoryPicker({
  quiz,
  progress,
  selected,
  onChange,
}: CategoryPickerProps) {
  const toggle = (id: string) => {
    const current = selected ?? [];
    const next = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    onChange(
      next.length === 0 || next.length === quiz.categories.length ? null : next,
    );
  };
  const allQuestions = quiz.questions;

  return (
    <section class={styles.section} aria-labelledby="categories-title">
      <h2 id="categories-title">Kategorien</h2>
      <div
        class={styles.categories}
        role="group"
        aria-labelledby="categories-title"
      >
        <button
          type="button"
          class={`option ${styles.category}`}
          aria-pressed={selected === null}
          onClick={() => onChange(null)}
        >
          <span>Alle</span>
          <span class="text-muted">
            {countMastered(allQuestions, progress)} / {allQuestions.length}
            <span class="visually-hidden"> gemeistert</span>
          </span>
        </button>
        {quiz.categories.map((category) => {
          const questions = allQuestions.filter(
            (q) => q.category === category.id,
          );
          return (
            <button
              key={category.id}
              type="button"
              class={`option ${styles.category}`}
              aria-pressed={selected?.includes(category.id) ?? false}
              onClick={() => toggle(category.id)}
            >
              <span>{category.name}</span>
              <span class="text-muted">
                {countMastered(questions, progress)} / {questions.length}
                <span class="visually-hidden"> gemeistert</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface RoundSizePickerProps {
  value: RoundSize;
  onChange: (size: RoundSize) => void;
}

export function RoundSizePicker({ value, onChange }: RoundSizePickerProps) {
  const numbers = ROUND_SIZE_CHOICES.filter((c): c is number => c !== "all");
  const choices: RoundSize[] =
    value === "all" || numbers.includes(value)
      ? [...ROUND_SIZE_CHOICES]
      : [...[...numbers, value].sort((a, b) => a - b), "all"];
  return (
    <section class={styles.section} aria-labelledby="size-title">
      <h2 id="size-title">Fragen pro Runde</h2>
      <div class={styles.sizes} role="group" aria-labelledby="size-title">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            class={`option ${styles.size}`}
            aria-pressed={choice === value}
            onClick={() => onChange(choice)}
          >
            {choice === "all" ? "Alle" : choice}
          </button>
        ))}
      </div>
    </section>
  );
}
