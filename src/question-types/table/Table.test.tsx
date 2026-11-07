import { fireEvent, render, screen, within } from "@testing-library/preact";
import { expect, test } from "vitest";
import { Round } from "../../app/round/Round.tsx";
import type { Question } from "../definitions.ts";
import { expectNoAxeViolations } from "../../test/axe.ts";

const input: Question = {
  id: "i1",
  type: "input",
  category: "c",
  prompt: "We ___ friends.",
  answer: "are",
};
const table: Question = {
  id: "t1",
  type: "table",
  category: "c",
  prompt: "Ergänze die Kurzformen.",
  columns: ["Langform", "Kurzform"],
  rows: [
    ["I am", "{I'm}"],
    ["they are", "{they're}"],
    ["{you are}", "you're"],
  ],
};

const focusedTextField = () => {
  const el = document.activeElement;
  return el instanceof HTMLInputElement && el.type === "text" ? el : null;
};
const type = (value: string) => {
  const field = focusedTextField()!;
  field.value = value;
  fireEvent.input(field);
};
const pressEnter = () =>
  fireEvent.keyDown(document.activeElement!, { key: "Enter" });

test("table: headers, labeled cells, Return walks row by row and submits on the last gap", async () => {
  const { container } = render(
    <Round
      questions={[input, table]}
      language="en"
      onFinish={() => {}}
      onExit={() => {}}
    />,
  );
  type("are");
  pressEnter();
  pressEnter(); // keyboard stays: the table's first gap takes focus

  expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(
    ["Langform", "Kurzform"],
  );
  expect(screen.getByRole("rowheader", { name: "I am" })).toBeTruthy();
  expect(focusedTextField()?.getAttribute("aria-label")).toBe("Kurzform, I am");
  expect(focusedTextField()?.getAttribute("enterkeyhint")).toBe("next");
  await expectNoAxeViolations(container);

  type("I’m");
  pressEnter();
  expect(focusedTextField()?.getAttribute("aria-label")).toBe(
    "Kurzform, they are",
  );
  type("their");
  pressEnter();
  const last = focusedTextField()!;
  expect(last.getAttribute("aria-label")).toBe("Langform, Zeile 3");
  expect(last.getAttribute("enterkeyhint")).toBe("done");
  expect(screen.queryByText("Falsch")).toBeNull();

  type("you are");
  pressEnter();
  expect(screen.getByText("Falsch")).toBeTruthy();
  // Wrong cells show their solution in the table, so the action bar has no "Lösung" line.
  expect(container.textContent).not.toContain("I'm · they're · you are");
  expect(focusedTextField()).toBe(last);
  expect(last.readOnly).toBe(true);

  const wrongRow = screen.getByRole("row", { name: /they are/ });
  expect(within(wrongRow).getByText("falsch")).toBeTruthy();
  expect(wrongRow.textContent).toContain("they're");
  const rightRow = screen.getByRole("row", { name: /^I am/ });
  expect(within(rightRow).getByText("richtig")).toBeTruthy();
  expect(rightRow.textContent).not.toContain("Lösung");
  await expectNoAxeViolations(container);
});
