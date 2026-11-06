import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { afterEach, expect, test, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe.ts";
import { loadSources } from "../storage/sources.ts";
import type { Quiz } from "../format/schema.ts";
import { parseHash, type HashParams } from "./hash.ts";
import { QuizScreen } from "./QuizScreen.tsx";
import valid from "../format/fixtures/valid.json" with { type: "json" };

const SRC = "https://example.org/quiz.json";
const quiz = valid as Quiz;
const show = (params: Partial<HashParams> = {}) =>
  render(
    <QuizScreen src={SRC} quiz={quiz} params={{ problems: [], ...params }} />,
  );
const pressed = (name: RegExp) =>
  screen.getByRole("button", { name }).getAttribute("aria-pressed");
const currentHash = () => parseHash(location.hash, { dev: false });

afterEach(() => vi.unstubAllGlobals());

test("link parameters preselect category and round size; changes rewrite the URL without history entries", async () => {
  const { container } = show({ cats: ["its"], n: 5 });
  expect(pressed(/^its oder it's/)).toBe("true");
  expect(pressed(/^Alle.*gemeistert$/)).toBe("false");
  expect(pressed(/^5$/)).toBe("true");
  expect(currentHash()).toMatchObject({ src: SRC, cats: ["its"], n: 5 });
  await expectNoAxeViolations(container);

  const entries = history.length;
  fireEvent.click(screen.getByRole("button", { name: /^my, your, his/ }));
  fireEvent.click(screen.getByRole("button", { name: /^20$/ }));
  // Both categories selected = all.
  expect(pressed(/^Alle.*gemeistert$/)).toBe("true");
  expect(currentHash()).toEqual({ src: SRC, n: 20, problems: [] });
  expect(history.length).toBe(entries);
  expect(loadSources()[0]!.roundSize).toBe(20);
});

test("unknown categories in the link fall back to all with a notice", () => {
  show({ cats: ["nope"] });
  expect(
    screen.getByText(/Kategorie „nope“ gibt es in diesem Quiz nicht/),
  ).toBeTruthy();
  expect(pressed(/^Alle.*gemeistert$/)).toBe("true");
});

test("the saved round size is used when the link has none", () => {
  show();
  fireEvent.click(screen.getByRole("button", { name: /^5$/ }));
  document.body.innerHTML = "";
  show();
  expect(pressed(/^5$/)).toBe("true");
});

test("a round only uses the selected categories", () => {
  show({ cats: ["its"] });
  fireEvent.click(screen.getByRole("button", { name: "Starten" }));
  expect(screen.getByText(/2$/, { selector: "h1" })).toBeTruthy(); // "Frage 1 / 2": two "its" questions
});

test("sharing copies the current URL; a blocked clipboard shows the link to copy", async () => {
  const writeText = vi
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("denied"));
  vi.stubGlobal("navigator", {
    ...navigator,
    share: undefined,
    clipboard: { writeText },
  });
  const { container } = show({ n: 10 });

  fireEvent.click(screen.getByRole("button", { name: "Link teilen" }));
  expect(await screen.findByText(/Link kopiert/)).toBeTruthy();
  expect(writeText).toHaveBeenLastCalledWith(location.href);

  fireEvent.click(screen.getByRole("button", { name: "Link teilen" }));
  const field = (await screen.findByLabelText(
    "Kopiere diesen Link:",
  )) as HTMLInputElement;
  expect(field.value).toBe(location.href);
  expect(field.readOnly).toBe(true);
  await expectNoAxeViolations(container);
});

test("the Web Share API is preferred when available", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", {
    ...navigator,
    share,
    clipboard: { writeText: vi.fn() },
  });
  show();
  fireEvent.click(screen.getByRole("button", { name: "Link teilen" }));
  await waitFor(() =>
    expect(share).toHaveBeenCalledWith({
      title: quiz.title,
      url: location.href,
    }),
  );
});
