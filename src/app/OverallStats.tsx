import { accuracy, lastDays, streak, totals } from "../engine/stats.ts";
import type { Activity } from "../storage/activity.ts";
import styles from "./Stats.module.css";

const weekday = new Intl.DateTimeFormat("de-DE", { weekday: "short" });
const longDate = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** Learning-day streak, last 7 days, and totals over all quizzes. Hidden until there is activity. */
export function OverallStats({
  activity,
  now = new Date(),
}: {
  activity: Activity;
  now?: Date;
}) {
  const all = totals(activity);
  if (all.answers === 0) return null;
  const days = lastDays(activity, now);
  const max = Math.max(...days.map((d) => d.answers), 1);
  const rate = accuracy(all);
  const learningDays = streak(activity, now);

  return (
    <section class={styles.section} aria-labelledby="overall-title">
      <h2 id="overall-title">Deine Statistik</h2>
      <dl class={styles.figures}>
        <div>
          <dt>Lerntage in Folge</dt>
          <dd>{learningDays}</dd>
        </div>
        <div>
          <dt>Antworten</dt>
          <dd>{all.answers}</dd>
        </div>
        <div>
          <dt>Trefferquote</dt>
          <dd>{rate === null ? "–" : `${rate} %`}</dd>
        </div>
      </dl>
      <h3 class={styles.subtitle} id="week-title">
        Letzte 7 Tage
      </h3>
      <ol class={styles.chart} aria-labelledby="week-title">
        {days.map(({ date, answers }) => (
          <li key={date.toDateString()}>
            <span
              class={styles.bar}
              data-empty={answers === 0 || undefined}
              style={{ height: `${(answers / max) * 100}%` }}
              aria-hidden="true"
            />
            <span aria-hidden="true">
              {weekday.format(date).replace(".", "")}
            </span>
            <span class="visually-hidden">
              {longDate.format(date)}: {answers}{" "}
              {answers === 1 ? "Antwort" : "Antworten"}
            </span>
          </li>
        ))}
      </ol>
      <p class="text-muted">
        {all.rounds} {all.rounds === 1 ? "Runde" : "Runden"} in den letzten 60
        Tagen.
      </p>
    </section>
  );
}
