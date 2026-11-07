import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import { buildCatalog } from "./buildCatalog.ts";
import valid from "../src/format/fixtures/valid.json" with { type: "json" };

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "catalog-"));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

async function put(path: string, content: unknown) {
  await mkdir(dirname(join(dir, path)), { recursive: true });
  await writeFile(join(dir, path), JSON.stringify(content));
}

const quiz = (title: string) => ({ ...valid, title });

test("lists quizzes sorted by path with relative src, ignoring an old catalog and dotfolders", async () => {
  await put("englisch/b.json", quiz("B"));
  await put("englisch/a.json", quiz("A"));
  await put("deutsch/z.json", quiz("Z"));
  await put("catalog.json", { catalog: 1, quizzes: [] });
  await put(".github/x.json", { not: "a quiz" });

  const result = await buildCatalog(dir);
  if (!result.ok) throw new Error(JSON.stringify(result.failures));
  expect(result.catalog.catalog).toBe(1);
  expect(result.catalog.quizzes.map((q) => [q.src, q.title])).toEqual([
    ["deutsch/z.json", "Z"],
    ["englisch/a.json", "A"],
    ["englisch/b.json", "B"],
  ]);
});

test("fails with every invalid file and its errors", async () => {
  await put("ok.json", quiz("OK"));
  await put("bad.json", { ...valid, schema: 2 });
  await writeFile(join(dir, "broken.json"), "{");

  const result = await buildCatalog(dir);
  if (result.ok) throw new Error("expected failure");
  expect(result.failures.map((f) => f.file).sort()).toEqual([
    join(dir, "bad.json"),
    join(dir, "broken.json"),
  ]);
  expect(
    result.failures.find((f) => f.file.endsWith("bad.json"))?.errors,
  ).toEqual([
    { path: "schema", message: "Quiz-Format Version 2 wird nicht unterstützt" },
  ]);
});

test("fails when the folder has no quiz", async () => {
  const result = await buildCatalog(dir);
  expect(result.ok).toBe(false);
});
