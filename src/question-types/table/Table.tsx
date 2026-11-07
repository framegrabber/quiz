import { Fragment } from "preact";
import { useMemo, useRef } from "preact/hooks";
import {
  answerInputAttributes,
  revealAfterKeyboard,
} from "../../ui/answerInput.ts";
import type { QuestionProps } from "../props.ts";
import type { ClozePart } from "../cloze/parse.ts";
import { GapMark } from "../cloze/GapMark.tsx";
import { tableCells } from "./check.ts";
import type { TableQuestion } from "./schema.ts";
import styles from "./Table.module.css";

const hasGap = (parts: ClozePart[]) => parts.some((p) => p.kind === "gap");
const cellText = (parts: ClozePart[]) =>
  parts.map((p) => (p.kind === "text" ? p.text : "")).join("");

/** Fill-in table: one field per gap, row by row. Return moves to the next gap; on the last it bubbles to the Round. */
export function Table({
  question,
  phase,
  result,
  onChange,
}: QuestionProps<TableQuestion, readonly string[]>) {
  const cells = useMemo(() => tableCells(question), [question]);
  const gapCount = cells.flat(2).filter((p) => p.kind === "gap").length;
  const values = useRef<string[]>(Array.from({ length: gapCount }, () => ""));
  const fields = useRef<(HTMLInputElement | null)[]>([]);

  const onInput = (g: number, value: string) => {
    values.current[g] = value;
    onChange(
      values.current.every((v) => v.trim()) ? [...values.current] : null,
    );
  };

  const onKeyDown = (g: number, event: KeyboardEvent) => {
    if (event.key !== "Enter" || g === gapCount - 1 || phase === "feedback")
      return;
    event.preventDefault();
    event.stopPropagation();
    fields.current[g + 1]?.focus();
  };

  let gapIndex = -1;
  const renderGap = (label: string) => {
    const g = ++gapIndex;
    const correct = result?.parts?.[g] ?? false;
    return (
      <span class={styles.gapBox}>
        <input
          {...answerInputAttributes}
          ref={(el) => {
            fields.current[g] = el;
          }}
          class={`text-input ${styles.gapInput}`}
          aria-label={label}
          enterKeyHint={g === gapCount - 1 ? "done" : "next"}
          readOnly={phase === "feedback"}
          data-state={result ? (correct ? "correct" : "incorrect") : undefined}
          onInput={(event) => onInput(g, event.currentTarget.value)}
          onKeyDown={(event) => onKeyDown(g, event)}
          onFocus={(event) => revealAfterKeyboard(event.currentTarget)}
        />
        {result && (
          <span class={styles.mark}>
            <GapMark correct={correct} />
          </span>
        )}
      </span>
    );
  };

  /** A cell with gaps: text and fields on one line; below, the corrected cell if a gap was wrong. */
  const renderGapCell = (parts: ClozePart[], label: string) => {
    const first = gapIndex + 1;
    const line = parts.map((part, i) =>
      part.kind === "text" ? (
        <span key={i} class={styles.cellText}>
          {part.text}
        </span>
      ) : (
        <Fragment key={i}>{renderGap(label)}</Fragment>
      ),
    );
    const wrong = result?.parts
      ?.slice(first, gapIndex + 1)
      .some((correct) => !correct);
    return (
      <>
        <span class={styles.cellLine}>{line}</span>
        {wrong && (
          <span class={styles.correction}>
            <span class="visually-hidden">Lösung: </span>
            {parts
              .map((p) => (p.kind === "text" ? p.text : p.answers[0]))
              .join("")}
          </span>
        )}
      </>
    );
  };

  return (
    <div class={styles.table}>
      {question.prompt && (
        <p class={styles.instruction} lang="de">
          {question.prompt}
        </p>
      )}
      <table class={`${styles.grid} content`}>
        <thead>
          <tr>
            {question.columns.map((column, c) => (
              <th key={c} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cells.map((row, r) => {
            const rowHeader =
              row[0] && !hasGap(row[0]) ? cellText(row[0]) : null;
            return (
              <tr key={r}>
                {row.map((parts, c) => {
                  const label = `${question.columns[c]}, ${rowHeader || `Zeile ${r + 1}`}`;
                  if (c === 0 && rowHeader !== null)
                    return (
                      <th key={c} scope="row">
                        {rowHeader}
                      </th>
                    );
                  return (
                    <td key={c}>
                      {hasGap(parts)
                        ? renderGapCell(parts, label)
                        : cellText(parts)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
