import { describe, expect, test } from "vitest";
import { checkTable } from "./check.ts";
import { tableSchema, type TableQuestion } from "./schema.ts";
import { formatPath } from "../../format/parse.ts";

const q: TableQuestion = {
  type: "table",
  category: "c",
  columns: ["Langform", "Kurzform"],
  rows: [
    ["I am", "{I'm}"],
    ["{he is|he's}", "he{'s}"],
  ],
};

describe("checkTable", () => {
  test("gaps are checked row by row; solution lists the first alternatives", () => {
    expect(checkTable(q, ["I’M", "he is", "'s"])).toEqual({
      correct: true,
      solution: "I'm · he is · 's",
      parts: [true, true, true],
      inlineSolution: true,
    });
  });

  test("one wrong or missing gap is marked and makes the table wrong", () => {
    expect(checkTable(q, ["Im", "he's"])).toEqual({
      correct: false,
      solution: "I'm · he is · 's",
      parts: [false, true, false],
      inlineSolution: true,
    });
  });

  test("caseSensitive applies to every gap", () => {
    expect(
      checkTable({ ...q, caseSensitive: true }, ["i'm", "he is", "'s"]).parts,
    ).toEqual([false, true, true]);
  });
});

describe("tableSchema", () => {
  const errors = (value: unknown) => {
    const result = tableSchema.safeParse(value);
    if (result.success) throw new Error("expected invalid");
    return result.error.issues.map((i) => [formatPath(i.path), i.message]);
  };

  test("accepts text, empty, and gap cells", () => {
    expect(
      tableSchema.safeParse({
        ...q,
        rows: [
          ["", "{I'm}"],
          ["x", "y"],
        ],
      }).success,
    ).toBe(true);
  });

  test("row length must match the columns; cell errors carry row, column, and position", () => {
    expect(errors({ ...q, rows: [["I am"], ["he is", "he{'s"]] })).toEqual([
      ["rows[0]", "Zeile hat 1 Zellen, erwartet 2 (eine pro Spalte)"],
      ["rows[1][1]", "Zeichen 3: Lücke ohne schließende }"],
    ]);
  });

  test("a table without any gap is rejected", () => {
    expect(errors({ ...q, rows: [["a", "b"]] })).toEqual([
      ["rows", "Die Tabelle braucht mindestens eine Lücke"],
    ]);
  });

  test("2–4 columns and 1–12 rows", () => {
    expect(tableSchema.safeParse({ ...q, columns: ["a"] }).success).toBe(false);
    expect(
      tableSchema.safeParse({
        ...q,
        columns: ["a", "b", "c", "d", "e"],
        rows: [["{a}", "b", "c", "d", "e"]],
      }).success,
    ).toBe(false);
    expect(
      tableSchema.safeParse({
        ...q,
        rows: Array.from({ length: 13 }, () => ["a", "{b}"]),
      }).success,
    ).toBe(false);
  });
});
