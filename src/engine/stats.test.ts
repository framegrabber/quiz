import { describe, expect, test } from "vitest";
import type { Question } from "../question-types/definitions.ts";
import {
  ACTIVITY_DAYS,
  addActivity,
  dayKey,
  type Activity,
} from "../storage/activity.ts";
import {
  accuracy,
  lastDays,
  missedQuestions,
  streak,
  tally,
  totals,
} from "./stats.ts";

const q = (id: string): Question => ({
  id,
  type: "input",
  category: "c",
  prompt: id,
  answer: "x",
});
const day = (answers: number) => ({ answers, correct: answers, rounds: 1 });
const at = (y: number, m: number, d: number, h = 12) =>
  new Date(y, m - 1, d, h);

test("accuracy rounds and is null without answers", () => {
  expect(accuracy({ answers: 0, correct: 0 })).toBeNull();
  expect(accuracy({ answers: 3, correct: 2 })).toBe(67);
});

test("tally sums right and wrong answers of the given questions only", () => {
  const progress = {
    a: { box: 1, right: 3, wrong: 1, lastSeen: 1 },
    other: { box: 0, right: 9, wrong: 9, lastSeen: 1 },
  };
  expect(tally([q("a"), q("b")], progress)).toEqual({ answers: 4, correct: 3 });
});

test("missed questions: wrong at least once, not mastered, most wrong first", () => {
  const progress = {
    a: { box: 0, right: 0, wrong: 1, lastSeen: 5 },
    b: { box: 3, right: 5, wrong: 4, lastSeen: 5 }, // mastered: excluded
    c: { box: 1, right: 2, wrong: 3, lastSeen: 5 },
    d: { box: 2, right: 2, wrong: 0, lastSeen: 5 }, // never wrong: excluded
  };
  expect(
    missedQuestions([q("a"), q("b"), q("c"), q("d"), q("e")], progress),
  ).toEqual([
    { question: q("c"), wrong: 3 },
    { question: q("a"), wrong: 1 },
  ]);
});

describe("streak", () => {
  const activity: Activity = {
    [dayKey(at(2026, 11, 3))]: day(5),
    [dayKey(at(2026, 11, 4))]: day(2),
    [dayKey(at(2026, 11, 5))]: day(1),
  };

  test("counts back from today when practised today", () => {
    expect(
      streak(
        { ...activity, [dayKey(at(2026, 11, 6))]: day(1) },
        at(2026, 11, 6),
      ),
    ).toBe(4);
  });

  test("still counts up to yesterday when nothing was practised yet today", () => {
    expect(streak(activity, at(2026, 11, 6, 7))).toBe(3);
  });

  test("a missed day breaks it", () => {
    expect(streak(activity, at(2026, 11, 7))).toBe(0);
  });

  test("crosses month boundaries", () => {
    const a = {
      [dayKey(at(2026, 10, 31))]: day(1),
      [dayKey(at(2026, 11, 1))]: day(1),
    };
    expect(streak(a, at(2026, 11, 1))).toBe(2);
  });
});

test("lastDays returns 7 days oldest first, zero-filled", () => {
  const series = lastDays(
    { [dayKey(at(2026, 11, 6))]: day(4), [dayKey(at(2026, 10, 31))]: day(2) },
    at(2026, 11, 6),
  );
  expect(series.map((d) => d.answers)).toEqual([2, 0, 0, 0, 0, 0, 4]);
  expect(dayKey(series[0]!.date)).toBe("2026-10-31");
});

test("addActivity adds to today and drops days beyond the retention window", () => {
  const now = at(2026, 11, 6);
  const old = dayKey(new Date(2026, 10, 6 - ACTIVITY_DAYS));
  const kept = dayKey(new Date(2026, 10, 6 - (ACTIVITY_DAYS - 1)));
  let a = addActivity(
    { [old]: day(1), [kept]: day(1) },
    { answers: 1, correct: 1 },
    now,
  );
  a = addActivity(a, { answers: 1, rounds: 1 }, now);
  expect(a[old]).toBeUndefined();
  expect(a[kept]).toEqual(day(1));
  expect(a[dayKey(now)]).toEqual({ answers: 2, correct: 1, rounds: 1 });
  expect(totals(a)).toEqual({ answers: 3, correct: 2, rounds: 2 });
});
