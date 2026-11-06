import { expect, test } from "vitest";
import { checkCloze } from "./check.ts";
import type { ClozeQuestion } from "./schema.ts";

const q: ClozeQuestion = {
  type: "cloze",
  category: "c",
  text: "I like {my} bike, but {her|Her} bike is faster.",
};

test("all gaps correct; solution is the sentence with the first alternatives", () => {
  expect(checkCloze(q, ["my", "her"])).toEqual({
    correct: true,
    solution: "I like my bike, but her bike is faster.",
    parts: [true, true],
  });
});

test("one wrong gap makes the question wrong and is marked per gap", () => {
  expect(checkCloze(q, ["my", "his"])).toMatchObject({
    correct: false,
    parts: [true, false],
  });
});

test("alternatives and normalization apply per gap; missing answers are wrong", () => {
  expect(checkCloze(q, [" MY ", "Her"]).correct).toBe(true);
  expect(checkCloze(q, ["my"])).toMatchObject({
    correct: false,
    parts: [true, false],
  });
});

test("caseSensitive applies to gaps", () => {
  expect(
    checkCloze({ ...q, caseSensitive: true }, ["My", "her"]).parts,
  ).toEqual([false, true]);
});
