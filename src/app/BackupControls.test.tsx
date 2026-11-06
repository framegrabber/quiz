import { fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, expect, test, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe.ts";
import { createBackup } from "../storage/backup.ts";
import { loadSources, saveSources } from "../storage/sources.ts";
import { Start } from "./Start.tsx";

afterEach(() => vi.unstubAllGlobals());

const entry = {
  url: "https://example.org/a.json",
  title: "Quiz A",
  lastUsed: Date.now(),
  total: 4,
  mastered: 2,
};

function chooseFile(content: string) {
  const input = screen.getByLabelText(
    "Sicherungsdatei wählen",
  ) as HTMLInputElement;
  const file = new File([content], "backup.json", { type: "application/json" });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  fireEvent.change(input);
}

test("importing a backup asks before replacing and then shows the restored quizzes", async () => {
  saveSources([entry]);
  const backup = JSON.stringify(createBackup());
  saveSources([]);

  const confirm = vi.fn().mockReturnValue(true);
  vi.stubGlobal("confirm", confirm);
  const { container } = render(<Start />);
  expect(screen.queryByText("Quiz A")).toBeNull();

  chooseFile(backup);
  expect(await screen.findByText("Fortschritt importiert.")).toBeTruthy();
  expect(confirm).toHaveBeenCalledWith("Vorhandenen Fortschritt ersetzen?");
  expect(screen.getByText("Quiz A")).toBeTruthy();
  await expectNoAxeViolations(container);
});

test("declining the confirmation or choosing an invalid file changes nothing", async () => {
  saveSources([entry]);
  vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
  render(<Start />);

  chooseFile(
    JSON.stringify(createBackup()).replace(
      '"exportVersion":1',
      '"exportVersion":9',
    ),
  );
  expect((await screen.findByRole("alert")).textContent).toContain(
    "keine Fortschritts-Sicherung",
  );

  chooseFile(
    JSON.stringify({ exportVersion: 1, exportedAt: "x", entries: {} }),
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(loadSources()).toEqual([entry]);
});
