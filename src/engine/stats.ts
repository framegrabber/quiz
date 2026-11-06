import { questionId } from "../format/questionId.ts";
import type { Question } from "../question-types/definitions.ts";
import type { Activity } from "../storage/activity.ts";
import { dayKey } from "../storage/activity.ts";
import { isMastered, type QuizProgress } from "./mastery.ts";

export interface Tally {
  answers: number;
  correct: number;
}

/** Correct share in percent (rounded), or null without answers. */
export function accuracy({ answers, correct }: Tally): number | null {
  return answers === 0 ? null : Math.round((correct / answers) * 100);
}

export function tally(
  questions: readonly Question[],
  progress: QuizProgress,
): Tally {
  let answers = 0;
  let correct = 0;
  for (const q of questions) {
    const p = progress[questionId(q)];
    if (!p) continue;
    answers += p.right + p.wrong;
    correct += p.right;
  }
  return { answers, correct };
}

/** Not-yet-mastered questions answered wrong at least once, most wrong answers first. */
export function missedQuestions(
  questions: readonly Question[],
  progress: QuizProgress,
): { question: Question; wrong: number }[] {
  return questions
    .map((question) => ({ question, p: progress[questionId(question)] }))
    .filter(({ p }) => p && p.wrong > 0 && !isMastered(p))
    .sort((a, b) => b.p!.wrong - a.p!.wrong || b.p!.lastSeen - a.p!.lastSeen)
    .map(({ question, p }) => ({ question, wrong: p!.wrong }));
}

const shiftDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Consecutive days with answers, ending today, or yesterday if today has none yet. */
export function streak(activity: Activity, now: Date): number {
  const active = (date: Date) => (activity[dayKey(date)]?.answers ?? 0) > 0;
  let day = active(now) ? now : shiftDays(now, -1);
  let count = 0;
  while (active(day)) {
    count++;
    day = shiftDays(day, -1);
  }
  return count;
}

/** The last 7 local days, oldest first. */
export function lastDays(
  activity: Activity,
  now: Date,
  days = 7,
): { date: Date; answers: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const date = shiftDays(now, i - (days - 1));
    return { date, answers: activity[dayKey(date)]?.answers ?? 0 };
  });
}

export function totals(activity: Activity): Tally & { rounds: number } {
  let answers = 0;
  let correct = 0;
  let rounds = 0;
  for (const day of Object.values(activity)) {
    answers += day.answers;
    correct += day.correct;
    rounds += day.rounds;
  }
  return { answers, correct, rounds };
}
