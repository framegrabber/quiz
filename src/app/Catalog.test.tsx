import { fireEvent, render, screen, within } from "@testing-library/preact";
import { expect, test, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe.ts";
import { saveSources } from "../storage/sources.ts";
import {
  DEFAULT_CATALOG_URL,
  loadCatalogUrl,
  saveCatalogUrl,
} from "../storage/catalog.ts";
import { Start } from "./Start.tsx";
import { App } from "./App.tsx";

const BASE = "https://framegrabber.github.io/quiz-content/";
const catalog = {
  catalog: 1,
  quizzes: [
    {
      src: "englisch/gl1/a.json",
      title: "Personal pronouns",
      description: "I am, you are",
      subject: "Englisch",
      grade: 5,
      source: "Green Line 1",
      questions: 38,
    },
    {
      src: "englisch/gl1/b.json",
      title: "There is / there are",
      subject: "Englisch",
      grade: 5,
      source: "Green Line 1",
      questions: 20,
    },
    { src: "misc/c.json", title: "Ohne Angaben", questions: 4 },
  ],
};

function serve(...responses: (() => Response)[]) {
  const fetchMock = vi.fn();
  for (const response of responses)
    fetchMock.mockImplementationOnce(async () => response());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const json = (body: unknown) => () => new Response(JSON.stringify(body));

test("lists the default catalog grouped, with progress for played quizzes", async () => {
  const fetchMock = serve(json(catalog));
  saveSources([
    {
      url: `${BASE}englisch/gl1/b.json`,
      title: "There is / there are",
      lastUsed: Date.now(),
      total: 20,
      mastered: 7,
    },
  ]);
  const { container } = render(<Start />);
  expect(screen.getByText("Katalog wird geladen …")).toBeTruthy();

  const group = await screen.findByRole("heading", {
    level: 3,
    name: "Englisch · Jgst. 5 · Green Line 1",
  });
  expect(fetchMock).toHaveBeenCalledWith(
    DEFAULT_CATALOG_URL,
    expect.anything(),
  );
  const list = within(group.parentElement!);
  const [a, b] = list.getAllByRole("link");
  expect(a!.getAttribute("href")).toBe(
    `#src=${encodeURIComponent(`${BASE}englisch/gl1/a.json`)}`,
  );
  expect(a!.textContent).toContain("I am, you are");
  expect(a!.textContent).toContain("38 Fragen");
  expect(b!.textContent).toContain("7 / 20 gemeistert");
  expect(
    screen.getByRole("heading", { level: 3, name: "Weitere Quizze" }),
  ).toBeTruthy();
  expect(screen.queryByText("Standardkatalog verwenden")).toBeNull();
  await expectNoAxeViolations(container);
});

test("a failed catalog shows an error with retry while the rest of Start works", async () => {
  serve(() => new Response("nope", { status: 500 }), json(catalog));
  const { container } = render(<Start />);
  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Fehler 500");
  expect(screen.getByLabelText("Quiz-Link einfügen")).toBeTruthy();
  await expectNoAxeViolations(container);

  fireEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));
  expect(await screen.findByText("Personal pronouns")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("a #catalog= link is remembered and can be reset to the default", async () => {
  const custom = "https://teacher.example/catalog.json";
  const fetchMock = serve(json(catalog), json(catalog));
  history.replaceState(null, "", `/#catalog=${encodeURIComponent(custom)}`);
  const { container } = render(<App />);

  expect(loadCatalogUrl()).toBe(custom);
  expect(fetchMock).toHaveBeenCalledWith(custom, expect.anything());
  const link = (await screen.findByText("Personal pronouns")).closest("a")!;
  expect(link.getAttribute("href")).toBe(
    `#src=${encodeURIComponent("https://teacher.example/englisch/gl1/a.json")}`,
  );
  expect(screen.getByText(`Eigener Katalog: ${custom}`)).toBeTruthy();
  await expectNoAxeViolations(container);

  fireEvent.click(
    screen.getByRole("button", { name: "Standardkatalog verwenden" }),
  );
  expect(loadCatalogUrl()).toBe(DEFAULT_CATALOG_URL);
  expect(fetchMock).toHaveBeenLastCalledWith(
    DEFAULT_CATALOG_URL,
    expect.anything(),
  );
  expect(screen.queryByText(/Eigener Katalog/)).toBeNull();
});

test("a stored catalog survives without a link; a rejected link shows a notice", async () => {
  saveCatalogUrl("https://teacher.example/catalog.json");
  const fetchMock = serve(json(catalog));
  history.replaceState(null, "", `/#catalog=${encodeURIComponent("ftp://x")}`);
  render(<App />);
  expect(screen.getByRole("status").textContent).toBe(
    "Ungültiger Katalog-Link wird ignoriert.",
  );
  expect(fetchMock).toHaveBeenCalledWith(
    "https://teacher.example/catalog.json",
    expect.anything(),
  );
  await screen.findByText("Personal pronouns");
});
