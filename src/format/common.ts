import { z } from "zod";
import de from "zod/v4/locales/de.js";

// German messages for built-in Zod issues (unknown keys, wrong types, ...). Import only this locale.
z.config(de());
// Clearer than "erwartet string, erhalten undefined" for authors.
z.config({
  customError: (issue) =>
    (issue.code === "invalid_type" || issue.code === "invalid_value") &&
    issue.input === undefined
      ? "Pflichtfeld fehlt"
      : undefined,
});

export const idSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9_-]{1,64}$/,
    "Erlaubt sind 1–64 Zeichen: A–Z, a–z, 0–9, _ und -",
  );

/** Non-empty text (not just whitespace). */
export const textSchema = z.string().regex(/\S/, "Darf nicht leer sein");

/** Fields every question type shares. */
export const questionBaseShape = {
  id: idSchema.optional(),
  category: idSchema,
  explanation: textSchema.optional(),
};

export function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}
