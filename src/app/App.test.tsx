import { fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, expect, test, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe.ts";
import { App } from "./App.tsx";
import valid from "../format/fixtures/valid.json" with { type: "json" };

const SRC = "https://example.org/quiz.json";

function serve(body: string, status = 200) {
  const { promise, resolve } = Promise.withResolvers<Response>();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => promise),
  );
  return () => resolve(new Response(body, { status }));
}

function openLink(src = SRC) {
  history.replaceState(null, "", `/#src=${encodeURIComponent(src)}`);
  return render(<App />);
}

/** The enabled start button of the loaded overview (the loading placeholder has a disabled one). */
async function loadedStart() {
  await screen.findByRole("heading", { level: 1, name: valid.title });
  return screen.getByRole("button", { name: "Starten" });
}

afterEach(() => vi.unstubAllGlobals());

test("loading shows a busy placeholder with a disabled start, then the overview", async () => {
  const respond = serve(JSON.stringify(valid));
  const { container } = openLink();
  expect(container.querySelector("[aria-busy=true]")).toBeTruthy();
  expect(
    (screen.getByRole("button", { name: "Starten" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  await expectNoAxeViolations(container);

  respond();
  expect(
    await screen.findByRole("heading", { level: 1, name: valid.title }),
  ).toBeTruthy();
  expect(container.querySelector("[aria-busy]")).toBeNull();
  await expectNoAxeViolations(container);
});

test.each([
  ["404", "nope", 404, "Quiz nicht gefunden"],
  ["server error", "boom", 500, "Quiz konnte nicht geladen werden"],
  ["not JSON", "<html>", 200, "Das ist kein Quiz"],
  [
    "invalid quiz",
    JSON.stringify({ schema: 1 }),
    200,
    "Das Quiz enthält Fehler",
  ],
])(
  "%s shows its own error with retry and home",
  async (_name, body, status, title) => {
    serve(body, status)();
    const { container } = openLink();
    expect(
      await screen.findByRole("heading", { level: 1, name: title }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Erneut versuchen" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Zur Startseite" })).toBeTruthy();
    await expectNoAxeViolations(container);
  },
);

test("invalid quiz lists at most 10 errors plus a count", async () => {
  const doc = structuredClone(valid) as Record<string, any>;
  doc.questions = Array.from({ length: 12 }, () => ({
    type: "choice",
    category: "x",
    prompt: "",
  }));
  serve(JSON.stringify(doc))();
  openLink();
  await screen.findByText("Das Quiz enthält Fehler");
  expect(screen.getAllByRole("listitem")).toHaveLength(11);
  expect(screen.getByText(/… und \d+ weitere/)).toBeTruthy();
});

test("a non-https link is rejected without fetching", async () => {
  const fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  openLink("http://example.org/quiz.json");
  expect(
    screen.getByRole("heading", { level: 1, name: "Ungültiger Quiz-Link" }),
  ).toBeTruthy();
  expect(fetchSpy).not.toHaveBeenCalled();
});

test("back during a round returns to the overview", async () => {
  serve(JSON.stringify(valid))();
  openLink();
  fireEvent.click(await loadedStart());
  expect(screen.getByRole("progressbar")).toBeTruthy();

  history.back();
  expect(await loadedStart()).toBeTruthy();
  expect(location.hash).toContain("src=");
});

test("a perfect round shows its own message", async () => {
  const doc = structuredClone(valid) as Record<string, any>;
  doc.questions = [doc.questions[0]];
  doc.categories = [doc.categories[1]];
  serve(JSON.stringify(doc))();
  openLink();
  fireEvent.click(await loadedStart());
  fireEvent.click(screen.getByRole("button", { name: "its" }));
  fireEvent.click(screen.getByRole("button", { name: "Ergebnis anzeigen" }));
  expect(screen.getByText("1 / 1 richtig")).toBeTruthy();
  expect(screen.getByText("Alles richtig – stark!")).toBeTruthy();
  expect(screen.queryByText("Noch üben")).toBeNull();
});
