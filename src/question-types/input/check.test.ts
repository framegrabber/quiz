import { expect, test } from "vitest";
import { checkInput } from "./check.ts";
import type { InputQuestion } from "./schema.ts";

const q: InputQuestion = {
  type: "input",
  category: "c",
  prompt: "___ dog is called Rex. (it)",
  answer: "Its",
  accept: ["its"],
};

test("the answer and every accept entry are correct; solution is the canonical answer", () => {
  expect(checkInput(q, "Its")).toEqual({ correct: true, solution: "Its" });
  expect(checkInput(q, " its ").correct).toBe(true);
});

test("it's is not its, even with a smart apostrophe", () => {
  expect(checkInput(q, "it’s").correct).toBe(false);
});

test("smart apostrophe input matches a straight-apostrophe answer", () => {
  expect(
    checkInput({ ...q, answer: "it's", accept: undefined }, "It’s").correct,
  ).toBe(true);
});

test("caseSensitive makes case matter for answer and accept", () => {
  const noun: InputQuestion = {
    ...q,
    prompt: "dog = ___",
    answer: "Hund",
    accept: undefined,
    caseSensitive: true,
  };
  expect(checkInput(noun, "Hund").correct).toBe(true);
  expect(checkInput(noun, "hund").correct).toBe(false);
});
