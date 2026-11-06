import { expect, test } from "vitest";
import {
  buildHash,
  resolveCategories,
  resolveRoundSize,
} from "./roundSettings.ts";
import { parseHash } from "./hash.ts";
import valid from "../format/fixtures/valid.json" with { type: "json" };
import type { Quiz } from "../format/schema.ts";

const quiz = valid as Quiz;

test("round size precedence: link > saved choice > quiz default > 10", () => {
  expect(resolveRoundSize(5, 20, 15)).toBe(5);
  expect(resolveRoundSize("all", 20, 15)).toBe("all");
  expect(resolveRoundSize(undefined, 20, 15)).toBe(20);
  expect(resolveRoundSize(undefined, undefined, 15)).toBe(15);
  expect(resolveRoundSize(undefined, undefined, undefined)).toBe(10);
});

test("known categories are preselected; any unknown id falls back to all with a report", () => {
  expect(resolveCategories(undefined, quiz)).toEqual({
    selected: null,
    unknown: [],
  });
  expect(resolveCategories(["its"], quiz)).toEqual({
    selected: ["its"],
    unknown: [],
  });
  expect(resolveCategories(["its", "nope"], quiz)).toEqual({
    selected: null,
    unknown: ["nope"],
  });
});

test("buildHash round-trips through parseHash", () => {
  const src = "https://example.org/q uiz.json?x=1&y=2";
  const parsed = parseHash(buildHash(src, ["forms", "its"], 20), {
    dev: false,
  });
  expect(parsed).toEqual({ src, cats: ["forms", "its"], n: 20, problems: [] });
  expect(parseHash(buildHash(src, null, "all"), { dev: false })).toEqual({
    src,
    n: "all",
    problems: [],
  });
});
