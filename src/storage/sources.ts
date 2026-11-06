import { z } from "zod";
import { PREFIX, readValue, writeValue } from "./store.ts";

export const MAX_SOURCES = 20;
export const SOURCES_KEY = `${PREFIX}sources`;

export const sourceEntrySchema = z.object({
  url: z.string(),
  title: z.string(),
  /** Epoch milliseconds. */
  lastUsed: z.number(),
  total: z.int().min(0),
  mastered: z.int().min(0),
  roundSize: z.union([z.int().positive(), z.literal("all")]).optional(),
});
export const sourcesSchema = z.array(sourceEntrySchema);

export type SourceEntry = z.infer<typeof sourceEntrySchema>;

/** Moves (or adds) the entry to the front, merging fields; keeps at most MAX_SOURCES. */
export function upsertSource(
  list: readonly SourceEntry[],
  entry: Partial<SourceEntry> & Pick<SourceEntry, "url">,
  now: number,
): SourceEntry[] {
  const existing = list.find((s) => s.url === entry.url);
  const merged: SourceEntry = {
    title: entry.url,
    total: 0,
    mastered: 0,
    ...existing,
    ...entry,
    lastUsed: now,
  };
  return [merged, ...list.filter((s) => s.url !== entry.url)].slice(
    0,
    MAX_SOURCES,
  );
}

export function loadSources(): SourceEntry[] {
  return readValue(SOURCES_KEY, sourcesSchema, []);
}

export function saveSources(list: readonly SourceEntry[]): boolean {
  return writeValue(SOURCES_KEY, list);
}
