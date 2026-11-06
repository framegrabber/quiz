import { render, screen, within } from "@testing-library/preact";
import { expect, test } from "vitest";
import { expectNoAxeViolations } from "../test/axe.ts";
import { dayKey, type Activity } from "../storage/activity.ts";
import { OverallStats } from "./OverallStats.tsx";

const now = new Date(2026, 10, 6, 12);
const day = (offset: number) => dayKey(new Date(2026, 10, 6 + offset));

test("hidden without any activity", () => {
  const { container } = render(<OverallStats activity={{}} now={now} />);
  expect(container.innerHTML).toBe("");
});

test("shows streak, totals, and an accessible 7-day chart", async () => {
  const activity: Activity = {
    [day(-1)]: { answers: 10, correct: 8, rounds: 1 },
    [day(0)]: { answers: 5, correct: 4, rounds: 1 },
    [day(-3)]: { answers: 5, correct: 0, rounds: 1 },
  };
  const { container } = render(<OverallStats activity={activity} now={now} />);
  const value = (label: string) =>
    screen.getByText(label).nextElementSibling?.textContent;
  expect(value("Lerntage in Folge")).toBe("2");
  expect(value("Antworten")).toBe("20");
  expect(value("Trefferquote")).toBe("60 %");
  expect(screen.getByText("3 Runden in den letzten 60 Tagen.")).toBeTruthy();

  const bars = within(
    screen.getByRole("list", { name: "Letzte 7 Tage" }),
  ).getAllByRole("listitem");
  expect(bars).toHaveLength(7);
  expect(bars[6]!.textContent).toContain("Freitag, 6. November: 5 Antworten");
  expect(bars[5]!.textContent).toContain("10 Antworten");
  expect(bars[4]!.textContent).toContain("0 Antworten");
  await expectNoAxeViolations(container);
});
