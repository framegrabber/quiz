import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { loadProgress, progressKey, saveProgress } from "./progress.ts";
import {
  MAX_SOURCES,
  SOURCES_KEY,
  loadSources,
  upsertSource,
  type SourceEntry,
} from "./sources.ts";
import { appKeys, writeValue } from "./store.ts";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

const URL_A = "https://example.org/a.json";

test("progress round-trips per quiz URL", () => {
  const progress = { q1: { box: 2, right: 2, wrong: 1, lastSeen: 5 } };
  expect(saveProgress(URL_A, progress)).toBe(true);
  expect(loadProgress(URL_A)).toEqual(progress);
  expect(loadProgress("https://example.org/other.json")).toEqual({});
  expect(appKeys()).toEqual([progressKey(URL_A)]);
});

test("corrupt progress is reset with a warning instead of breaking the app", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  localStorage.setItem(progressKey(URL_A), "{not json");
  expect(loadProgress(URL_A)).toEqual({});
  localStorage.setItem(progressKey(URL_A), JSON.stringify({ q1: { box: 9 } }));
  expect(loadProgress(URL_A)).toEqual({});
  expect(localStorage.getItem(progressKey(URL_A))).toBeNull();
  expect(warn).toHaveBeenCalledTimes(2);
});

test("a failing write reports false (quota, disabled storage)", () => {
  const full = {
    setItem() {
      throw new DOMException("full", "QuotaExceededError");
    },
  };
  vi.stubGlobal("localStorage", full);
  expect(writeValue(SOURCES_KEY, [])).toBe(false);
  vi.unstubAllGlobals();
});

test("upsertSource moves the entry to the front, keeps known fields, and caps the list", () => {
  const entry = (i: number): SourceEntry => ({
    url: `https://x/${i}`,
    title: `Quiz ${i}`,
    lastUsed: i,
    total: 10,
    mastered: i,
  });
  const list = Array.from({ length: MAX_SOURCES }, (_, i) => entry(i));

  const reopened = upsertSource(list, { url: "https://x/5" }, 100);
  expect(reopened[0]).toEqual({ ...entry(5), lastUsed: 100 });
  expect(reopened).toHaveLength(MAX_SOURCES);
  expect(reopened.filter((s) => s.url === "https://x/5")).toHaveLength(1);

  const added = upsertSource(
    list,
    { url: "https://x/new", title: "Neu", total: 3, mastered: 0 },
    200,
  );
  expect(added[0]!.url).toBe("https://x/new");
  expect(added).toHaveLength(MAX_SOURCES);
  expect(added.at(-1)!.url).toBe("https://x/18");
});

test("corrupt sources list is reset", () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  localStorage.setItem(SOURCES_KEY, JSON.stringify([{ url: 1 }]));
  expect(loadSources()).toEqual([]);
});
