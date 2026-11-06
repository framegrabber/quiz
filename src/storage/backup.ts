import { z } from "zod";
import {
  ACTIVITY_KEY,
  ROUNDS_PREFIX,
  activitySchema,
  roundsSchema,
} from "./activity.ts";
import { quizProgressSchema } from "./progress.ts";
import { SOURCES_KEY, sourcesSchema } from "./sources.ts";
import { PREFIX, appKeys, removeValue, writeValue } from "./store.ts";

const PROGRESS_PREFIX = `${PREFIX}progress:`;

/** Schema of a stored app key; null for keys the app does not know. */
function schemaFor(key: string): z.ZodType | null {
  if (key === SOURCES_KEY) return sourcesSchema;
  if (key === ACTIVITY_KEY) return activitySchema;
  if (key.startsWith(PROGRESS_PREFIX)) return quizProgressSchema;
  if (key.startsWith(ROUNDS_PREFIX)) return roundsSchema;
  return null;
}

const backupSchema = z
  .object({
    exportVersion: z.literal(1),
    exportedAt: z.string(),
    entries: z.record(z.string(), z.unknown()),
  })
  .superRefine((backup, ctx) => {
    for (const [key, value] of Object.entries(backup.entries)) {
      if (!schemaFor(key)?.safeParse(value).success) {
        ctx.addIssue({
          code: "custom",
          path: ["entries", key],
          message: "unbekannt oder beschädigt",
        });
      }
    }
  });

export type Backup = z.infer<typeof backupSchema>;

/** All app data (sources and progress) as one JSON document. */
export function createBackup(now: Date = new Date()): Backup {
  const entries: Record<string, unknown> = {};
  for (const key of appKeys()) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try {
      entries[key] = JSON.parse(raw);
    } catch {
      // corrupt entries are not exported
    }
  }
  return { exportVersion: 1, exportedAt: now.toISOString(), entries };
}

export function backupFileName(now: Date = new Date()): string {
  return `quiz-fortschritt-${now.toISOString().slice(0, 10)}.json`;
}

export type ParsedBackup = { ok: true; backup: Backup } | { ok: false };

export function parseBackup(text: string): ParsedBackup {
  try {
    const parsed = backupSchema.safeParse(JSON.parse(text));
    return parsed.success ? { ok: true, backup: parsed.data } : { ok: false };
  } catch {
    return { ok: false };
  }
}

/** Replaces all app data with the backup. Returns false if any write failed. */
export function restoreBackup(backup: Backup): boolean {
  for (const key of appKeys()) removeValue(key);
  return Object.entries(backup.entries).every(([key, value]) =>
    writeValue(key, value),
  );
}
