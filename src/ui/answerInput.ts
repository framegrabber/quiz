/** Attributes for every typed-answer field: no autocorrect/capitalization changing the student's answer. */
export const answerInputAttributes = {
  type: "text",
  autocapitalize: "off",
  autocorrect: "off",
  autocomplete: "off",
  spellcheck: false,
} as const;
