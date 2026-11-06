import { expect, test } from "vitest";
import { fitWarnings } from "./fitWarnings.ts";
import type { Quiz } from "./schema.ts";

const quiz = (questions: Quiz["questions"]): Quiz => ({
  schema: 1,
  title: "T",
  categories: [{ id: "c", name: "C" }],
  questions,
});

test("content at the limits produces no warnings", () => {
  const warnings = fitWarnings(
    quiz([
      { type: "input", category: "c", prompt: "x".repeat(120), answer: "a" },
      {
        type: "choice",
        category: "c",
        prompt: "p",
        options: ["a", "b", "c", "d"],
        answer: "a",
      },
      {
        type: "cloze",
        category: "c",
        text: `{a} {b} {c} {d}${"x".repeat(153)}`,
        distractors: ["e", "f", "g", "h"],
      },
    ]),
  );
  expect(warnings).toEqual([]);
});

test("each limit just exceeded produces a warning at its path", () => {
  const warnings = fitWarnings(
    quiz([
      { type: "input", category: "c", prompt: "x".repeat(121), answer: "a" },
      {
        type: "choice",
        category: "c",
        prompt: "p",
        options: ["a", "b", "c", "d", "e"],
        answer: "a",
      },
      { type: "cloze", category: "c", text: `{a}${"x".repeat(160)}` },
      { type: "cloze", category: "c", text: "{a} {b} {c} {d} {e}" },
      {
        type: "cloze",
        category: "c",
        text: "{a}",
        distractors: ["1", "2", "3", "4", "5", "6", "7", "8"],
      },
    ]),
  );
  expect(warnings.map((w) => w.path)).toEqual([
    "questions[0].prompt",
    "questions[1].options",
    "questions[2].text",
    "questions[3].text",
    "questions[4]",
  ]);
});

test("type-mode cloze has no word bank, so no bank warning", () => {
  const distractors = ["1", "2", "3", "4", "5", "6", "7", "8"];
  expect(
    fitWarnings(
      quiz([
        {
          type: "cloze",
          category: "c",
          text: "{a}",
          mode: "type",
          distractors,
        },
      ]),
    ),
  ).toEqual([]);
});
