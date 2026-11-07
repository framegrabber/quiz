import { beforeEach, expect, test } from "vitest";
import {
  backupFileName,
  createBackup,
  parseBackup,
  restoreBackup,
} from "./backup.ts";
import { loadProgress, saveProgress } from "./progress.ts";
import {
  countRound,
  loadActivity,
  loadRounds,
  recordActivity,
} from "./activity.ts";
import { loadSources, saveSources } from "./sources.ts";
import { loadCatalogUrl, saveCatalogUrl } from "./catalog.ts";

beforeEach(() => localStorage.clear());

const URL_A = "https://example.org/a.json";

function seed() {
  saveProgress(URL_A, { q1: { box: 3, right: 3, wrong: 0, lastSeen: 1 } });
  saveSources([
    {
      url: URL_A,
      title: "A",
      lastUsed: 1,
      total: 1,
      mastered: 1,
      roundSize: 5,
    },
  ]);
  recordActivity({ answers: 4, correct: 3, rounds: 1 });
  countRound(URL_A);
  localStorage.setItem("other-app", "keep me");
  saveCatalogUrl("https://example.org/catalog.json");
}

test("export → clear → import restores identical app data and leaves other keys alone", () => {
  seed();
  const text = JSON.stringify(createBackup(new Date("2026-11-06T10:00:00Z")));
  const snapshot = () => ({
    progress: loadProgress(URL_A),
    sources: loadSources(),
    activity: loadActivity(),
    rounds: loadRounds(URL_A),
    catalog: loadCatalogUrl(),
  });
  const before = snapshot();
  expect(before.rounds).toBe(1);
  expect(before.catalog).toBe("https://example.org/catalog.json");

  saveProgress(URL_A, {});
  saveSources([]);
  localStorage.clear();
  localStorage.setItem("other-app", "keep me");
  const parsed = parseBackup(text);
  expect(parsed.ok).toBe(true);
  if (parsed.ok) expect(restoreBackup(parsed.backup)).toBe(true);

  expect(snapshot()).toEqual(before);
  expect(localStorage.getItem("other-app")).toBe("keep me");
});

test("import replaces: data not in the backup is removed", () => {
  const empty = JSON.stringify(createBackup());
  seed();
  const parsed = parseBackup(empty);
  if (!parsed.ok) throw new Error("expected a valid backup");
  restoreBackup(parsed.backup);
  expect(loadSources()).toEqual([]);
  expect(loadProgress(URL_A)).toEqual({});
});

test.each([
  ["not JSON", "{"],
  [
    "wrong version",
    JSON.stringify({ exportVersion: 2, exportedAt: "x", entries: {} }),
  ],
  [
    "unknown key",
    JSON.stringify({
      exportVersion: 1,
      exportedAt: "x",
      entries: { "quiz:v1:other": 1 },
    }),
  ],
  [
    "corrupt progress",
    JSON.stringify({
      exportVersion: 1,
      exportedAt: "x",
      entries: { "quiz:v1:progress:u": { q: { box: 7 } } },
    }),
  ],
])("rejects %s without touching stored data", (_name, text) => {
  seed();
  expect(parseBackup(text)).toEqual({ ok: false });
  expect(loadSources()).toHaveLength(1);
});

test("file name carries the date", () => {
  expect(backupFileName(new Date("2026-11-06T10:00:00Z"))).toBe(
    "quiz-fortschritt-2026-11-06.json",
  );
});
