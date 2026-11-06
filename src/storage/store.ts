import type { z } from "zod";

/** All keys of this app; the origin is shared with other GitHub Pages projects. */
export const PREFIX = "quiz:v1:";

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // e.g. storage disabled by the browser
  }
}

/** Reads and validates a stored value. Corrupt entries are removed with a warning; absent → fallback. */
export function readValue<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  const raw = storage()?.getItem(key);
  if (raw === null || raw === undefined) return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // invalid JSON: handled below
  }
  console.warn(
    `Gespeicherte Daten unter ${key} sind beschädigt und werden zurückgesetzt.`,
  );
  storage()?.removeItem(key);
  return fallback;
}

let writeFailed = false;
const failureListeners = new Set<() => void>();

/** True once any write failed in this page load (shown as a persistent banner). */
export const hasWriteFailed = () => writeFailed;

export function onWriteFailure(listener: () => void): () => void {
  failureListeners.add(listener);
  return () => failureListeners.delete(listener);
}

/** Returns false when the value could not be stored (quota, disabled storage). */
export function writeValue(key: string, value: unknown): boolean {
  try {
    const store = storage();
    if (!store) throw new Error("localStorage unavailable");
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    writeFailed = true;
    failureListeners.forEach((listener) => listener());
    return false;
  }
}

export function removeValue(key: string): void {
  storage()?.removeItem(key);
}

export function appKeys(): string[] {
  const store = storage();
  if (!store) return [];
  return Array.from({ length: store.length }, (_, i) => store.key(i)).filter(
    (key): key is string => key?.startsWith(PREFIX) ?? false,
  );
}

let persistenceRequested = false;

/** Asks the browser to keep our data (best effort, once per page load). */
export function requestPersistence(): void {
  if (persistenceRequested) return;
  persistenceRequested = true;
  navigator.storage?.persist?.().catch(() => {});
}
