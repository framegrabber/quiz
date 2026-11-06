import { fireEvent, render, screen } from "@testing-library/preact";
import { expect, test, vi } from "vitest";
import type { PlayableQuestion } from "../../question-types/registry.tsx";
import { expectNoAxeViolations } from "../../test/axe.ts";
import { Round } from "./Round.tsx";

const single: PlayableQuestion = {
  id: "q1",
  type: "choice",
  category: "c",
  prompt: "The cat is playing with ___ ball.",
  options: ["its", "it's", "his"],
  answer: "its",
  explanation: "its = Besitz",
};
const multi: PlayableQuestion = {
  id: "q2",
  type: "choice",
  category: "c",
  prompt: "Which are possessive determiners?",
  options: ["my", "me", "our"],
  answer: ["my", "our"],
};

/** Keyboard activation of the focused button (Enter/Space trigger click on buttons). */
const activateFocused = () => fireEvent.click(document.activeElement!);
const focusOn = (name: string) =>
  screen.getByRole("button", { name: new RegExp(`^${name}`) }).focus();

test("keyboard-only round: single choice, feedback, multi choice, finish", async () => {
  const onFinish = vi.fn();
  const { container } = render(
    <Round
      questions={[single, multi]}
      language="en"
      onFinish={onFinish}
      onExit={() => {}}
    />,
  );
  await expectNoAxeViolations(container);

  // First option is focused on start; pick the wrong one.
  expect(document.activeElement?.classList.contains("option")).toBe(true);
  focusOn("it's");
  activateFocused();

  expect(screen.getByText("Falsch")).toBeTruthy();
  expect(screen.getByText("its = Besitz")).toBeTruthy();
  expect(document.activeElement?.textContent).toBe("Weiter");
  await expectNoAxeViolations(container);
  activateFocused();

  // Multi choice: toggles expose state; submit is enabled only with a selection.
  const submit = screen.getByRole("button", {
    name: "Antwort abgeben",
  }) as HTMLButtonElement;
  expect(submit.disabled).toBe(true);
  focusOn("my");
  activateFocused();
  expect(document.activeElement?.getAttribute("aria-pressed")).toBe("true");
  focusOn("our");
  activateFocused();
  expect(submit.disabled).toBe(false);
  fireEvent.click(submit);

  expect(screen.getByText("Richtig")).toBeTruthy();
  expect(document.activeElement?.textContent).toBe("Ergebnis anzeigen");
  activateFocused();

  expect(onFinish).toHaveBeenCalledOnce();
  const answered = onFinish.mock.calls[0]![0];
  expect(
    answered.map((a: { result: { correct: boolean } }) => a.result.correct),
  ).toEqual([false, true]);
});

test("the correct option is marked after a wrong answer, not by color alone", () => {
  render(<Round questions={[single]} onFinish={() => {}} onExit={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "his" }));
  expect(screen.getByRole("button", { name: /^its/ }).textContent).toContain(
    "richtige Antwort",
  );
  expect(screen.getByRole("button", { name: /^his/ }).textContent).toContain(
    "deine Antwort, falsch",
  );
});
