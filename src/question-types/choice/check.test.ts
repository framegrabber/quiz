import { expect, test } from "vitest";
import { checkChoice } from "./check.ts";
import type { ChoiceQuestion } from "./schema.ts";

const single: ChoiceQuestion = {
  type: "choice",
  category: "c",
  prompt: "The cat is playing with ___ ball.",
  options: ["its", "it's", "his"],
  answer: "its",
};
const multi: ChoiceQuestion = {
  ...single,
  options: ["my", "me", "our", "us"],
  answer: ["my", "our"],
};

test("single choice: only the answer is correct", () => {
  expect(checkChoice(single, ["its"])).toEqual({
    correct: true,
    solution: "its",
  });
  expect(checkChoice(single, ["it's"]).correct).toBe(false);
});

test("multi choice: the selected set must equal the answer set", () => {
  expect(checkChoice(multi, ["our", "my"])).toEqual({
    correct: true,
    solution: "my, our",
  });
  expect(checkChoice(multi, ["my"]).correct).toBe(false);
  expect(checkChoice(multi, ["my", "our", "us"]).correct).toBe(false);
});
