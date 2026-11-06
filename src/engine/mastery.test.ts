import { describe, expect, test } from "vitest";
import type { Question } from "../question-types/definitions.ts";
import {
  applyAnswer,
  countMastered,
  isMastered,
  type QuizProgress,
} from "./mastery.ts";
import { selectRound } from "./selectRound.ts";

describe("applyAnswer", () => {
  test("three correct answers in a row master a question; it stays at the top box", () => {
    let p = applyAnswer(undefined, true, 1);
    expect(isMastered(p)).toBe(false);
    p = applyAnswer(p, true, 2);
    p = applyAnswer(p, true, 3);
    expect(isMastered(p)).toBe(true);
    p = applyAnswer(p, true, 4);
    expect(p).toEqual({ box: 3, right: 4, wrong: 0, lastSeen: 4 });
  });

  test("one wrong answer drops back to box 0 and counts the mistake", () => {
    let p = applyAnswer(undefined, true, 1);
    p = applyAnswer(p, true, 2);
    p = applyAnswer(p, false, 3);
    expect(p).toEqual({ box: 0, right: 2, wrong: 1, lastSeen: 3 });
  });
});

const q = (id: string): Question => ({
  id,
  type: "input",
  category: "c",
  prompt: id,
  answer: "x",
});
const pool = ["a", "b", "c", "d", "e"].map(q);
const ids = (questions: Question[]) => questions.map((x) => x.id).sort();
/** Deterministic RNG for tests. */
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32;
  return seed / 2 ** 32;
};

describe("selectRound", () => {
  const progress: QuizProgress = {
    a: { box: 3, right: 3, wrong: 0, lastSeen: 50 },
    b: { box: 0, right: 0, wrong: 1, lastSeen: 40 },
    c: { box: 1, right: 1, wrong: 0, lastSeen: 10 },
    d: { box: 1, right: 1, wrong: 0, lastSeen: 30 },
    // e: never seen
  };

  test("prefers low boxes, then never seen and least recently seen", () => {
    expect(ids(selectRound(pool, progress, 2, seeded(1)))).toEqual(["b", "e"]);
    expect(ids(selectRound(pool, progress, 3, seeded(1)))).toEqual([
      "b",
      "c",
      "e",
    ]);
  });

  test("mastered questions only fill up when nothing else is left", () => {
    expect(ids(selectRound(pool, progress, 4, seeded(2)))).toEqual([
      "b",
      "c",
      "d",
      "e",
    ]);
    expect(ids(selectRound(pool, progress, 10, seeded(2)))).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });

  test("'all' takes the whole pool", () => {
    expect(selectRound(pool, progress, "all", seeded(3))).toHaveLength(5);
  });

  test("deterministic with a seeded RNG", () => {
    const order = (seed: number) =>
      selectRound(pool, {}, 5, seeded(seed)).map((x) => x.id);
    expect(order(7)).toEqual(order(7));
  });
});

test("countMastered counts box-3 questions of the given list only", () => {
  expect(
    countMastered(pool, {
      a: { box: 3, right: 3, wrong: 0, lastSeen: 1 },
      zz: { box: 3, right: 3, wrong: 0, lastSeen: 1 },
    }),
  ).toBe(1);
});
