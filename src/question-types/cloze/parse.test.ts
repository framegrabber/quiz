import { describe, expect, test } from "vitest";
import { parseCloze } from "./parse.ts";

describe("parseCloze", () => {
  test("splits text and gaps", () => {
    expect(parseCloze("I like {my} bike, but {her} bike is faster.")).toEqual({
      ok: true,
      parts: [
        { kind: "text", text: "I like " },
        { kind: "gap", answers: ["my"] },
        { kind: "text", text: " bike, but " },
        { kind: "gap", answers: ["her"] },
        { kind: "text", text: " bike is faster." },
      ],
    });
  });

  test("alternatives are split on | and trimmed", () => {
    expect(parseCloze("{ your | Your }")).toEqual({
      ok: true,
      parts: [{ kind: "gap", answers: ["your", "Your"] }],
    });
  });

  test("escaped braces are literal text, | outside a gap is literal", () => {
    expect(parseCloze("a \\{b\\} | {c}")).toEqual({
      ok: true,
      parts: [
        { kind: "text", text: "a {b} | " },
        { kind: "gap", answers: ["c"] },
      ],
    });
  });

  test("a backslash before other characters stays", () => {
    expect(parseCloze("C:\\temp {x}")).toEqual({
      ok: true,
      parts: [
        { kind: "text", text: "C:\\temp " },
        { kind: "gap", answers: ["x"] },
      ],
    });
  });

  test.each([
    ["no gap", "plain text", 0, "Der Text enthält keine Lücke"],
    ["unclosed gap", "a {my bike", 2, "Lücke ohne schließende }"],
    ["stray closing brace", "a } {b}", 2, "} ohne öffnende {"],
    ["nested gap", "{a {b}}", 3, "Lücken dürfen nicht verschachtelt sein"],
    ["empty gap", "a {} b", 2, "Lücke ohne Antwort"],
    ["empty alternative", "{my|}", 0, "Lücke mit leerer Alternative"],
    [
      "whitespace-only alternative",
      "{ | my}",
      0,
      "Lücke mit leerer Alternative",
    ],
  ])("%s is an error with its position", (_name, text, index, message) => {
    const result = parseCloze(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContainEqual({ index, message });
  });
});
