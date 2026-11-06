import { fireEvent, render, screen } from "@testing-library/preact";
import { expect, test, vi } from "vitest";
import { Round } from "../../app/round/Round.tsx";
import type { Question } from "../definitions.ts";
import { expectNoAxeViolations } from "../../test/axe.ts";

const bank: Question = {
  id: "b1",
  type: "cloze",
  category: "c",
  text: "I like {my} bike, but {her} bike is faster.",
  distractors: ["his"],
};
const typedCloze: Question = {
  id: "t1",
  type: "cloze",
  category: "c",
  text: "{It's|It is} cold, so the cat is in {its} basket.",
  mode: "type",
};
const input: Question = {
  id: "i1",
  type: "input",
  category: "c",
  prompt: "We love ___ dog.",
  answer: "our",
};

const gap = (n: number, state: string) =>
  screen.getByRole("button", { name: `Lücke ${n} von 2: ${state}` });
const tile = (word: string) => screen.getByRole("button", { name: word });
const activateFocused = () => fireEvent.click(document.activeElement!);
const flush = () => new Promise((resolve) => requestAnimationFrame(resolve));
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

test("word bank: fill the first empty gap, return a word, fill a selected gap, submit", async () => {
  const { container } = render(
    <Round
      questions={[bank]}
      language="en"
      onFinish={() => {}}
      onExit={() => {}}
    />,
  );
  await expectNoAxeViolations(container);
  const submit = screen.getByRole("button", {
    name: "Antwort abgeben",
  }) as HTMLButtonElement;

  tile("her").focus();
  activateFocused(); // her → gap 1 (first empty)
  await flush();
  expect(gap(1, "her")).toBeTruthy();
  expect((tile("her") as HTMLButtonElement).disabled).toBe(true);
  expect(document.activeElement?.tagName).toBe("BUTTON"); // focus stays in the bank

  fireEvent.click(gap(1, "her")); // return the word, gap 1 becomes selected
  expect(gap(1, "leer").getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(gap(2, "leer")); // select gap 2 instead
  fireEvent.click(tile("her"));
  fireEvent.click(tile("my")); // fills the remaining gap 1
  expect(gap(1, "my")).toBeTruthy();
  expect(gap(2, "her")).toBeTruthy();
  expect(submit.disabled).toBe(false);

  fireEvent.click(submit);
  expect(screen.getByText("Richtig")).toBeTruthy();
  expect(
    container.querySelectorAll(".text-correct .visually-hidden"),
  ).toHaveLength(2);
  await expectNoAxeViolations(container);
});

test("word bank feedback marks each gap", () => {
  render(<Round questions={[bank]} onFinish={() => {}} onExit={() => {}} />);
  fireEvent.click(tile("his"));
  fireEvent.click(tile("her"));
  fireEvent.click(screen.getByRole("button", { name: "Antwort abgeben" }));
  expect(screen.getByText("Falsch")).toBeTruthy();
  expect(gap(1, "his").textContent).toContain("falsch");
  expect(gap(2, "her").textContent).toContain("richtig");
  expect(
    screen.getByText("I like my bike, but her bike is faster."),
  ).toBeTruthy();
});

test("typed cloze: Return moves to the next gap, then submits; focus stays in text fields from an input question", async () => {
  const { container } = render(
    <Round
      questions={[input, typedCloze]}
      language="en"
      onFinish={() => {}}
      onExit={() => {}}
    />,
  );
  type("our");
  pressEnter();
  pressEnter(); // to the typed cloze

  const first = focusedTextField();
  expect(first?.getAttribute("aria-label")).toBe("Lücke 1 von 2");
  expect(first?.getAttribute("enterkeyhint")).toBe("next");
  await expectNoAxeViolations(container);

  type("it is");
  pressEnter();
  const second = focusedTextField();
  expect(second?.getAttribute("aria-label")).toBe("Lücke 2 von 2");
  expect(second?.getAttribute("enterkeyhint")).toBe("done");
  expect(screen.queryByText("Richtig")).toBeNull();

  type("its");
  pressEnter();
  expect(screen.getByText("Richtig")).toBeTruthy();
  expect(focusedTextField()).toBe(second);
  expect(second!.readOnly).toBe(true);
});
