import { z } from "zod";
import type { QuizProgress } from "../engine/mastery.ts";
import { PREFIX, readValue, writeValue } from "./store.ts";

export const questionProgressSchema = z.object({
  box: z.int().min(0).max(3),
  right: z.int().min(0),
  wrong: z.int().min(0),
  lastSeen: z.number(),
});

export const quizProgressSchema = z.record(z.string(), questionProgressSchema);

export const progressKey = (url: string) => `${PREFIX}progress:${url}`;

export function loadProgress(url: string): QuizProgress {
  return readValue(progressKey(url), quizProgressSchema, {});
}

export function saveProgress(url: string, progress: QuizProgress): boolean {
  return writeValue(progressKey(url), progress);
}
