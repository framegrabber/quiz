import { describe, expect, test } from "vitest";
import { parseHash } from "./hash.ts";

const quizUrl =
  "https://framegrabber.github.io/quiz-content/englisch/quiz.json";
const hash = (params: string) => `#${params}`;

describe("parseHash", () => {
  test("no hash means no source", () => {
    expect(parseHash("", { dev: false })).toEqual({ problems: [] });
  });

  test("reads an encoded https source, categories, and round size", () => {
    expect(
      parseHash(hash(`src=${encodeURIComponent(quizUrl)}&cat=forms,its&n=5`), {
        dev: false,
      }),
    ).toEqual({ src: quizUrl, cats: ["forms", "its"], n: 5, problems: [] });
  });

  test("n=all is a valid round size", () => {
    expect(
      parseHash(hash(`src=${encodeURIComponent(quizUrl)}&n=all`), {
        dev: false,
      }).n,
    ).toBe("all");
  });

  test("rejects non-https sources", () => {
    for (const src of [
      "http://example.com/q.json",
      "javascript:alert(1)",
      "not a url",
    ]) {
      const result = parseHash(hash(`src=${encodeURIComponent(src)}`), {
        dev: false,
      });
      expect(result).toEqual({ srcRejected: true, problems: [] });
    }
  });

  test("allows http on localhost only in dev", () => {
    const local = "http://localhost:8080/q.json";
    expect(
      parseHash(hash(`src=${encodeURIComponent(local)}`), { dev: true }).src,
    ).toBe(local);
    expect(
      parseHash(hash(`src=${encodeURIComponent(local)}`), { dev: false }).src,
    ).toBeUndefined();
  });

  test("invalid round size is ignored with a notice", () => {
    for (const n of ["0", "-3", "2.5", "many"]) {
      const result = parseHash(
        hash(`src=${encodeURIComponent(quizUrl)}&n=${n}`),
        { dev: false },
      );
      expect(result.n).toBeUndefined();
      expect(result.problems).toEqual([
        `Ungültige Rundengröße „${n}“ wird ignoriert.`,
      ]);
    }
  });
});
