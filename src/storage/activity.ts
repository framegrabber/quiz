import { z } from "zod";
import { PREFIX, readValue, writeValue } from "./store.ts";

export const ACTIVITY_KEY = `${PREFIX}activity`;
export const ROUNDS_PREFIX = `${PREFIX}rounds:`;
/** Days kept in the activity log. */
export const ACTIVITY_DAYS = 60;

export const dayActivitySchema = z.object({
  answers: z.int().min(0),
  correct: z.int().min(0),
  rounds: z.int().min(0),
});
export const activitySchema = z.record(
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayActivitySchema,
);
export const roundsSchema = z.object({ rounds: z.int().min(0) });

export type DayActivity = z.infer<typeof dayActivitySchema>;
/** Keyed by local date `YYYY-MM-DD`. */
export type Activity = Record<string, DayActivity>;

/** Local calendar date as `YYYY-MM-DD`. */
export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Adds to today's entry and drops days older than ACTIVITY_DAYS. */
export function addActivity(
  activity: Activity,
  delta: Partial<DayActivity>,
  now: Date,
): Activity {
  const today = dayKey(now);
  const oldest = dayKey(
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (ACTIVITY_DAYS - 1),
    ),
  );
  const current = activity[today] ?? { answers: 0, correct: 0, rounds: 0 };
  const next: Activity = {};
  for (const [day, value] of Object.entries(activity))
    if (day >= oldest) next[day] = value;
  next[today] = {
    answers: current.answers + (delta.answers ?? 0),
    correct: current.correct + (delta.correct ?? 0),
    rounds: current.rounds + (delta.rounds ?? 0),
  };
  return next;
}

export function loadActivity(): Activity {
  return readValue(ACTIVITY_KEY, activitySchema, {});
}

export function recordActivity(
  delta: Partial<DayActivity>,
  now: Date = new Date(),
): boolean {
  return writeValue(ACTIVITY_KEY, addActivity(loadActivity(), delta, now));
}

export const roundsKey = (url: string) => `${ROUNDS_PREFIX}${url}`;

export function loadRounds(url: string): number {
  return readValue(roundsKey(url), roundsSchema, { rounds: 0 }).rounds;
}

export function countRound(url: string): boolean {
  return writeValue(roundsKey(url), { rounds: loadRounds(url) + 1 });
}
