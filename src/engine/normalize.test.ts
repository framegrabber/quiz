import { describe, expect, test } from "vitest";
import { answersMatch, normalize } from "./normalize.ts";

describe("normalize", () => {
  test("smart and typographic apostrophes become a straight apostrophe", () => {
    for (const apostrophe of ["’", "‘", "‛", "´", "`"]) {
      expect(normalize(`it${apostrophe}s`)).toBe("it's");
    }
  });

  test("trims and collapses inner whitespace, including non-breaking spaces", () => {
    expect(normalize("  their \t  dog\u00a0 ")).toBe("their dog");
  });

  test("lowercases by default, keeps case when case-sensitive", () => {
    expect(normalize("Their")).toBe("their");
    expect(normalize(" Hund ", { caseSensitive: true })).toBe("Hund");
  });

  test("composes decomposed umlauts (NFC)", () => {
    expect(normalize("Mu\u0308nchen")).toBe(normalize("München"));
  });
});

describe("answersMatch", () => {
  test("accepts iOS input for it's: capitalized with a smart apostrophe", () => {
    expect(answersMatch("It’s", "it's")).toBe(true);
  });

  test("its and it's stay different", () => {
    expect(answersMatch("its", "it's")).toBe(false);
    expect(answersMatch("it's", "its")).toBe(false);
  });

  test("does not forgive punctuation or typos", () => {
    expect(answersMatch("their.", "their")).toBe(false);
    expect(answersMatch("thier", "their")).toBe(false);
  });

  test("case-sensitive comparison", () => {
    expect(answersMatch("hund", "Hund", { caseSensitive: true })).toBe(false);
    expect(answersMatch("Hund", "Hund", { caseSensitive: true })).toBe(true);
  });
});
