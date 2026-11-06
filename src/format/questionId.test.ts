import { expect, test } from "vitest";
import { questionId } from "./questionId.ts";
import type { Question } from "../question-types/definitions.ts";

const base: Question = {
  type: "choice",
  category: "forms",
  prompt: "The cat is playing with ___ ball.",
  options: ["its", "it's"],
  answer: "its",
};

test("an explicit id wins", () => {
  expect(questionId({ ...base, id: "pd-001" })).toBe("pd-001");
});

test("derived id is stable across key order", () => {
  const reordered = Object.fromEntries(
    Object.entries(base).reverse(),
  ) as Question;
  expect(questionId(reordered)).toBe(questionId(base));
  expect(questionId(base)).toMatch(/^h:[0-9a-f]{8}$/);
});

test("derived id changes when the content changes", () => {
  expect(questionId({ ...base, answer: "it's" })).not.toBe(questionId(base));
  expect(questionId({ ...base, options: ["it's", "its"] })).not.toBe(
    questionId(base),
  );
});
