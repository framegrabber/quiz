import { fireEvent, render, screen } from "@testing-library/preact";
import { expect, test, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe.ts";
import {
  loadSources,
  saveSources,
  type SourceEntry,
} from "../storage/sources.ts";
import { Start, formatLastUsed, linkToHash } from "./Start.tsx";

const QUIZ = "https://framegrabber.github.io/quiz-content/englisch/quiz.json";

test("linkToHash accepts a quiz file URL or a full app link, rejects others", () => {
  expect(linkToHash(` ${QUIZ} `, false)).toBe(
    `#src=${encodeURIComponent(QUIZ)}`,
  );
  const appLink = `https://framegrabber.github.io/quiz/#src=${encodeURIComponent(QUIZ)}&n=5`;
  expect(linkToHash(appLink, false)).toBe(
    `#src=${encodeURIComponent(QUIZ)}&n=5`,
  );
  expect(linkToHash("http://example.org/q.json", false)).toBeNull();
  expect(linkToHash("Quiz", false)).toBeNull();
});

test("formatLastUsed says heute / gestern / date", () => {
  const now = new Date(2026, 10, 6, 9, 0);
  expect(formatLastUsed(new Date(2026, 10, 6, 0, 5).getTime(), now)).toBe(
    "heute",
  );
  expect(formatLastUsed(new Date(2026, 10, 5, 23, 59).getTime(), now)).toBe(
    "gestern",
  );
  expect(formatLastUsed(new Date(2026, 9, 1).getTime(), now)).toBe("1.10.2026");
});

test("first visit explains the app and opens a pasted link", async () => {
  const { container } = render(<Start />);
  expect(
    screen.getByText(/Quiz-Links, die du von deiner Lehrkraft/),
  ).toBeTruthy();
  const field = screen.getByLabelText("Quiz-Link einfügen") as HTMLInputElement;
  expect(document.activeElement).toBe(field);
  await expectNoAxeViolations(container);

  fireEvent.input(field, { target: { value: "kein link" } });
  fireEvent.click(screen.getByRole("button", { name: "Öffnen" }));
  expect(screen.getByRole("alert").textContent).toContain(
    "kein gültiger Quiz-Link",
  );
  expect(location.hash).toBe("");

  fireEvent.input(field, { target: { value: QUIZ } });
  fireEvent.click(screen.getByRole("button", { name: "Öffnen" }));
  expect(location.hash).toBe(`#src=${encodeURIComponent(QUIZ)}`);
});

test("recent quizzes are listed newest first and can be removed after confirming", async () => {
  const entry = (n: number): SourceEntry => ({
    url: `https://example.org/${n}.json`,
    title: `Ein sehr langer Quiz-Titel Nummer ${n} mit https://example.org/einem/langen/pfad`,
    lastUsed: Date.now(),
    total: 40,
    mastered: n,
  });
  saveSources([entry(2), entry(1)]);
  const { container } = render(<Start />);
  expect(
    screen.queryByText(/Quiz-Links, die du von deiner Lehrkraft/),
  ).toBeNull();
  const links = screen.getAllByRole("link");
  expect(links.map((a) => a.getAttribute("href"))).toEqual([
    `#src=${encodeURIComponent("https://example.org/2.json")}`,
    `#src=${encodeURIComponent("https://example.org/1.json")}`,
  ]);
  expect(links[0]!.textContent).toContain("2 / 40 gemeistert · heute");
  await expectNoAxeViolations(container);

  const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
  vi.stubGlobal("confirm", confirm);
  const removeFirst = () =>
    fireEvent.click(
      screen.getAllByRole("button", { name: /aus der Liste entfernen/ })[0]!,
    );
  removeFirst();
  expect(loadSources()).toHaveLength(2);
  removeFirst();
  expect(loadSources().map((s) => s.url)).toEqual([
    "https://example.org/1.json",
  ]);
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(confirm).toHaveBeenCalledTimes(2);
  vi.unstubAllGlobals();
});
