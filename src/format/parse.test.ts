import { describe, expect, test } from "vitest";
import { formatPath, parseQuiz } from "./parse.ts";
import valid from "./fixtures/valid.json" with { type: "json" };

type Doc = Record<string, any>;

function variant(change: (doc: Doc) => void): Doc {
  const doc = structuredClone(valid) as Doc;
  change(doc);
  return doc;
}

function errorsOf(doc: unknown) {
  const result = parseQuiz(doc);
  if (result.ok) throw new Error("expected the document to be invalid");
  return result.errors;
}

describe("parseQuiz", () => {
  test("accepts the valid fixture", () => {
    const result = parseQuiz(valid);
    expect(result.ok).toBe(true);
  });

  test("rejects other format versions with one clear message", () => {
    expect(errorsOf(variant((d) => (d.schema = 2)))).toEqual([
      {
        path: "schema",
        message: "Quiz-Format Version 2 wird nicht unterstützt",
      },
    ]);
  });

  test("reports all problems at once, each with its path", () => {
    const errors = errorsOf(
      variant((d) => {
        d.title = " ";
        d.questions[0].anwser = "its";
      }),
    );
    expect(errors.map((e) => e.path)).toEqual(
      expect.arrayContaining(["title", "questions[0]"]),
    );
    expect(errors.find((e) => e.path === "questions[0]")?.message).toContain(
      "anwser",
    );
  });

  test.each<[string, (d: Doc) => void, string, string]>([
    ["unknown top-level field", (d) => (d.author = "x"), "", "author"],
    ["missing title", (d) => delete d.title, "title", ""],
    ["grade out of range", (d) => (d.grade = 4), "grade", ""],
    [
      "invalid language code",
      (d) => (d.language = "Englisch"),
      "language",
      "Sprachcode",
    ],
    ["no categories", (d) => (d.categories = []), "categories", ""],
    ["no questions", (d) => (d.questions = []), "questions", ""],
    [
      "invalid id characters",
      (d) => (d.questions[0].id = "pd 1"),
      "questions[0].id",
      "Erlaubt",
    ],
    [
      "unknown category reference",
      (d) => (d.questions[0].category = "nope"),
      "questions[0].category",
      '"nope" ist nicht in categories definiert',
    ],
    [
      "category without questions",
      (d) => d.categories.push({ id: "empty", name: "Leer" }),
      "categories[2]",
      "enthält keine Fragen",
    ],
    [
      "duplicate category id",
      (d) => d.categories.push({ id: "forms", name: "Nochmal" }),
      "categories[2].id",
      "mehrfach",
    ],
    [
      "duplicate question id",
      (d) => (d.questions[1].id = "pd-001"),
      "questions[1].id",
      "zuerst bei questions[0]",
    ],
    [
      "identical questions without ids",
      (d) => {
        delete d.questions[0].id;
        d.questions[1] = structuredClone(d.questions[0]);
      },
      "questions[1]",
      "Gleiche Frage wie questions[0]",
    ],
    [
      "unknown question type",
      (d) => (d.questions[0].type = "essay"),
      "questions[0].type",
      "",
    ],
    [
      "one option only",
      (d) => (d.questions[0].options = ["its"]),
      "questions[0].options",
      "",
    ],
    [
      "duplicate options",
      (d) => (d.questions[0].options = ["its", "its", "his"]),
      "questions[0].options",
      "eindeutig",
    ],
    [
      "answer not among options",
      (d) => (d.questions[0].answer = "her"),
      "questions[0].answer",
      '"her" ist nicht in options enthalten',
    ],
    [
      "multi answer with an unknown value",
      (d) => (d.questions[1].answer = ["my", "your"]),
      "questions[1].answer",
      '"your" ist nicht in options enthalten',
    ],
    [
      "empty prompt",
      (d) => (d.questions[0].prompt = ""),
      "questions[0].prompt",
      "leer",
    ],
  ])("%s", (_name, change, path, message) => {
    const errors = errorsOf(variant(change));
    const match = errors.find((e) => e.path === path);
    expect(match, JSON.stringify(errors)).toBeDefined();
    expect(match!.message).toContain(message);
  });
});

test("formatPath renders array indices in brackets", () => {
  expect(formatPath(["questions", 3, "answer"])).toBe("questions[3].answer");
  expect(formatPath([])).toBe("");
});
