import { z } from "zod";
import { PREFIX, readValue, removeValue, writeValue } from "./store.ts";

export const CATALOG_KEY = `${PREFIX}catalog`;
export const DEFAULT_CATALOG_URL =
  "https://framegrabber.github.io/quiz-content/catalog.json";

export const catalogUrlSchema = z.string();

/** The catalog shown on Start: the one from the last `#catalog=` link, else the default. */
export function loadCatalogUrl(): string {
  return readValue(CATALOG_KEY, catalogUrlSchema, DEFAULT_CATALOG_URL);
}

export function saveCatalogUrl(url: string): void {
  if (url === DEFAULT_CATALOG_URL) removeValue(CATALOG_KEY);
  else writeValue(CATALOG_KEY, url);
}

export function resetCatalogUrl(): void {
  removeValue(CATALOG_KEY);
}
