import { fireEvent, render, screen } from "@testing-library/preact";
import { expect, test, vi } from "vitest";
import { Round } from "../../app/round/Round.tsx";
import type { PlayableQuestion } from "../registry.tsx";
import { expectNoAxeViolations } from "../../test/axe.ts";

const typed = (
  id: string,
  prompt: string,
  answer: string,
): PlayableQuestion => ({
  id,
  type: "input",
  category: "c",
  prompt,
  answer,
});
const choice: PlayableQuestion = {
  id: "c1",
  type: "choice",
  category: "c",
  prompt: "The cat is playing with ___ ball.",
  options: ["its", "it's"],
  answer: "its",
};

const type = (value: string) => {
  const field = document.activeElement as HTMLInputElement;
  field.value = value;
  fireEvent.input(field);
};
const pressEnter = () =>
  fireEvent.keyDown(document.activeElement!, { key: "Enter" });
const focusedTextField = () => {
  const el = document.activeElement;
  return el instanceof HTMLInputElement && el.type === "text" ? el : null;
};

test("consecutive typed questions keep a text field focused; Return submits and continues", async () => {
  const onFinish = vi.fn();
  const { container } = render(
    <Round
      questions={[
        typed("i1", "Tom and Lisa love ___ dog.", "their"),
        typed("i2", "I like ___ bike.", "my"),
        choice,
      ]}
      language="en"
      onFinish={onFinish}
      onExit={() => {}}
    />,
  );
  await expectNoAxeViolations(container);

  const first = focusedTextField();
  expect(first).not.toBeNull();
  expect(first!.getAttribute("autocorrect")).toBe("off");
  expect(
    (
      screen.getByRole("button", {
        name: "Antwort abgeben",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);

  pressEnter(); // empty: nothing happens
  expect(screen.queryByText("Richtig")).toBeNull();

  type("Their");
  pressEnter();
  expect(screen.getByText("Richtig")).toBeTruthy();
  expect(focusedTextField()).toBe(first);
  expect(first!.readOnly).toBe(true);
  await expectNoAxeViolations(container);

  pressEnter();
  const second = focusedTextField();
  expect(second).not.toBeNull();
  expect(second!.readOnly).toBe(false);
  expect(screen.getByText(/I like/)).toBeTruthy();

  type("mine");
  pressEnter();
  expect(screen.getByText("Falsch")).toBeTruthy();
  expect(screen.getByText("my")).toBeTruthy();

  pressEnter(); // next is a choice question: focus leaves the text field (keyboard closes)
  expect(focusedTextField()).toBeNull();
  expect(document.activeElement?.classList.contains("option")).toBe(true);
});
