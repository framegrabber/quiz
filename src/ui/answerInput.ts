/** Attributes for every typed-answer field: no autocorrect/capitalization changing the student's answer. */
export const answerInputAttributes = {
  type: "text",
  autocapitalize: "off",
  autocorrect: "off",
  autocomplete: "off",
  spellcheck: false,
} as const;

/** Keeps a focused field visible once the on-screen keyboard has resized the viewport. */
export function revealAfterKeyboard(field: HTMLElement): void {
  field.scrollIntoView({ block: "nearest" });
  window.visualViewport?.addEventListener(
    "resize",
    () => field.scrollIntoView({ block: "nearest" }),
    { once: true },
  );
}
