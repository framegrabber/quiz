import { fireEvent, render, screen, within } from "@testing-library/preact";
import { expect, test } from "vitest";
import { expectNoAxeViolations } from "../test/axe.ts";
import { saveProgress } from "../storage/progress.ts";
import { loadActivity, dayKey } from "../storage/activity.ts";
import type { Quiz } from "../format/schema.ts";
import { QuizScreen } from "./QuizScreen.tsx";

const SRC = "https://example.org/stats.json";
const choice = (id: string, category: string, prompt: string) => ({
  id,
  type: "choice" as const,
  category,
  prompt,
  options: ["its", "it's"],
  answer: "its",
});
const quiz: Quiz = {
  schema: 1,
  title: "Stats",
  categories: [
    { id: "a", name: "Kategorie A" },
    { id: "b", name: "Kategorie B" },
  ],
  questions: [
    choice("q1", "a", "Erste Frage ___"),
    choice("q2", "a", "Zweite Frage ___"),
    choice("q3", "b", "Dritte Frage ___"),
  ],
};
const show = () =>
  render(<QuizScreen src={SRC} quiz={quiz} params={{ problems: [] }} />);
const stats = () => within(screen.getByRole("region", { name: "Statistik" }));

test("without answers the stats show dashes and no mistakes", () => {
  show();
  expect(
    stats().getByText("Trefferquote").nextElementSibling?.textContent,
  ).toBe("–");
  expect(stats().queryByRole("button", { name: /Fehler üben/ })).toBeNull();
});

test("accuracy, rounds, answers, most-missed list, and a mistakes-only round", async () => {
  saveProgress(SRC, {
    q1: { box: 0, right: 1, wrong: 3, lastSeen: 2 },
    q2: { box: 3, right: 3, wrong: 1, lastSeen: 2 }, // mastered: not a "mistake" any more
    q3: { box: 1, right: 2, wrong: 1, lastSeen: 1 },
  });
  const { container } = show();
  expect(
    stats().getByText("Trefferquote").nextElementSibling?.textContent,
  ).toBe("55 %"); // 6 of 11
  expect(stats().getByText("Antworten").nextElementSibling?.textContent).toBe(
    "11",
  );
  const perCategory = within(
    screen.getByRole("list", { name: "Trefferquote je Kategorie" }),
  );
  expect(
    perCategory.getByText("Kategorie A").nextElementSibling?.textContent,
  ).toBe("50 %");
  expect(
    perCategory.getByText("Kategorie B").nextElementSibling?.textContent,
  ).toBe("67 %");
  const missed = stats()
    .getAllByRole("listitem")
    .filter((li) => li.textContent?.includes("× falsch"));
  expect(missed.map((li) => li.textContent)).toEqual([
    "Erste Frage ___3× falsch",
    "Dritte Frage ___1× falsch",
  ]);
  await expectNoAxeViolations(container);

  fireEvent.click(stats().getByRole("button", { name: "Fehler üben (2)" }));
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
    "1 / 2",
  );
  for (let i = 0; i < 2; i++) {
    fireEvent.click(screen.getByRole("button", { name: "its" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: i === 0 ? "Weiter" : "Ergebnis anzeigen",
      }),
    );
  }
  expect(screen.getByText("2 / 2 richtig")).toBeTruthy();
  expect(loadActivity()[dayKey(new Date())]).toEqual({
    answers: 2,
    correct: 2,
    rounds: 1,
  });

  fireEvent.click(screen.getByRole("button", { name: "Zur Übersicht" }));
  await screen.findByRole("region", { name: "Statistik" });
  expect(stats().getByText("Runden").nextElementSibling?.textContent).toBe("1");
});
