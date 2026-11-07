import { describe, expect, test } from "vitest";
import {
  catalogEntry,
  groupCatalog,
  isCatalogDocument,
  parseCatalog,
  type CatalogEntry,
} from "./catalog.ts";
import { parseQuiz } from "./parse.ts";
import valid from "./fixtures/valid.json" with { type: "json" };

const entry = (fields: Partial<CatalogEntry> = {}): CatalogEntry => ({
  src: "englisch/a.json",
  title: "A",
  questions: 3,
  ...fields,
});

describe("parseCatalog", () => {
  test("accepts a catalog and keeps optional fields", () => {
    const doc = {
      catalog: 1,
      quizzes: [entry({ subject: "Englisch", grade: 5 })],
    };
    expect(parseCatalog(doc)).toEqual({ ok: true, catalog: doc });
  });

  test("rejects other catalog versions with one clear message", () => {
    expect(parseCatalog({ catalog: 2, quizzes: [] })).toEqual({
      ok: false,
      errors: [
        {
          path: "catalog",
          message: "Katalog-Format Version 2 wird nicht unterstützt",
        },
      ],
    });
  });

  test("reports unknown fields, empty lists, and bad counts with paths", () => {
    const result = parseCatalog({
      catalog: 1,
      quizzes: [{ ...entry(), questions: 0, tilte: "x" }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((e) => e.path).sort()).toEqual([
      "quizzes[0]",
      "quizzes[0].questions",
    ]);
    expect(parseCatalog({ catalog: 1, quizzes: [] }).ok).toBe(false);
  });
});

test("isCatalogDocument tells catalogs from quizzes", () => {
  expect(isCatalogDocument({ catalog: 1, quizzes: [] })).toBe(true);
  expect(isCatalogDocument(valid)).toBe(false);
  expect(isCatalogDocument(null)).toBe(false);
});

test("catalogEntry copies the listing fields, drops the rest, and counts questions", () => {
  const parsed = parseQuiz(valid);
  if (!parsed.ok) throw new Error("fixture must be valid");
  const result = catalogEntry("x/quiz.json", parsed.quiz);
  expect(result).toEqual({
    src: "x/quiz.json",
    title: "Possessive determiners (Beispiel)",
    subject: "Englisch",
    grade: 5,
    source: "Green Line 1 Bayern",
    questions: 5,
  });
  expect(parseCatalog({ catalog: 1, quizzes: [result] }).ok).toBe(true);
});

test("groupCatalog groups by subject, grade, and source in catalog order", () => {
  const a = entry({ title: "A", subject: "Englisch", grade: 5, source: "GL1" });
  const b = entry({ title: "B" });
  const c = entry({ title: "C", subject: "Englisch", grade: 5, source: "GL1" });
  const d = entry({ title: "D", subject: "Erdkunde" });
  expect(groupCatalog([a, b, c, d])).toEqual([
    { label: "Englisch · Jgst. 5 · GL1", entries: [a, c] },
    { label: "Weitere Quizze", entries: [b] },
    { label: "Erdkunde", entries: [d] },
  ]);
});
