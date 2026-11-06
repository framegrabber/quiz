import { fireEvent, render, screen } from "@testing-library/preact";
import { expect, test, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe.ts";
import { loadProgress } from "../storage/progress.ts";
import { loadSources } from "../storage/sources.ts";
import type { Quiz } from "../format/schema.ts";
import { QuizScreen } from "./QuizScreen.tsx";

const SRC = "https://example.org/its.json";
const quiz: Quiz = {
  schema: 1,
  title: "its oder it's",
  categories: [{ id: "its", name: "its" }],
  questions: [
    {
      id: "q1",
      type: "choice",
      category: "its",
      prompt: "The dog wags ___ tail.",
      options: ["its", "it's"],
      answer: "its",
    },
  ],
};

const show = () =>
  render(<QuizScreen src={SRC} quiz={quiz} params={{ problems: [] }} />);

function playCorrectRound() {
  fireEvent.click(screen.getByRole("button", { name: "Starten" }));
  fireEvent.click(screen.getByRole("button", { name: "its" }));
  fireEvent.click(screen.getByRole("button", { name: "Ergebnis anzeigen" }));
}

test("three correct rounds master a question; progress survives a reload", async () => {
  show();
  const total = (text: string) =>
    screen.getByText((_, el) => el?.tagName === "P" && el.textContent === text);
  expect(total("0 / 1 gemeistert")).toBeTruthy();
  playCorrectRound();
  expect(screen.getByText("Gemeistert: 0 / 1")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Neue Runde" }));
  fireEvent.click(screen.getByRole("button", { name: "its" }));
  fireEvent.click(screen.getByRole("button", { name: "Ergebnis anzeigen" }));
  fireEvent.click(screen.getByRole("button", { name: "Neue Runde" }));
  fireEvent.click(screen.getByRole("button", { name: "its" }));
  fireEvent.click(screen.getByRole("button", { name: "Ergebnis anzeigen" }));
  expect(screen.getByText(/Gemeistert: 1 \/ 1/)).toBeTruthy();
  expect(screen.getByText("(+1)")).toBeTruthy();

  expect(loadProgress(SRC).q1).toMatchObject({ box: 3, right: 3, wrong: 0 });
  expect(loadSources()[0]).toMatchObject({
    url: SRC,
    title: quiz.title,
    total: 1,
    mastered: 1,
  });

  // Reload: a fresh screen reads the stored progress and says everything is mastered.
  document.body.innerHTML = "";
  const { container } = show();
  expect(
    screen.getByText(
      "Alles gemeistert! Eine neue Runde wiederholt die Fragen.",
    ),
  ).toBeTruthy();
  expect(
    (screen.getByRole("button", { name: "Starten" }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
  await expectNoAxeViolations(container);
});

test("when saving fails, a banner says so and the quiz stays playable", async () => {
  const failing = {
    getItem: () => null,
    setItem: () => {
      throw new DOMException("full", "QuotaExceededError");
    },
    removeItem() {},
    key: () => null,
    length: 0,
  };
  vi.stubGlobal("localStorage", failing);
  const { container } = show();
  expect(screen.getByText(/Fortschritt wird nicht gespeichert/)).toBeTruthy();
  playCorrectRound();
  expect(screen.getByText("1 / 1 richtig")).toBeTruthy();
  expect(screen.getByText(/Fortschritt wird nicht gespeichert/)).toBeTruthy();
  await expectNoAxeViolations(container);
  vi.unstubAllGlobals();
});
