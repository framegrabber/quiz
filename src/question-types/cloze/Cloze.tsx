import { useMemo } from "preact/hooks";
import type { QuestionProps } from "../props.ts";
import { clozeParts } from "./check.ts";
import type { ClozeQuestion } from "./schema.ts";
import { ClozeBank } from "./ClozeBank.tsx";
import { ClozeTyped } from "./ClozeTyped.tsx";
import styles from "./Cloze.module.css";

export function Cloze(props: QuestionProps<ClozeQuestion, readonly string[]>) {
  const { question } = props;
  const parts = useMemo(() => clozeParts(question), [question]);
  return (
    <div class={styles.cloze}>
      {question.prompt && (
        <p class={styles.instruction} lang="de">
          {question.prompt}
        </p>
      )}
      {question.mode === "type" ? (
        <ClozeTyped {...props} parts={parts} />
      ) : (
        <ClozeBank {...props} parts={parts} />
      )}
    </div>
  );
}
