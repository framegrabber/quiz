import { Fragment } from "preact";
import { useMemo, useRef, useState } from "preact/hooks";
import { shuffle } from "../../engine/shuffle.ts";
import type { QuestionProps } from "../props.ts";
import type { ClozePart } from "./parse.ts";
import type { ClozeQuestion } from "./schema.ts";
import { GapMark } from "./GapMark.tsx";
import styles from "./Cloze.module.css";

type Props = QuestionProps<ClozeQuestion, readonly string[]> & {
  parts: ClozePart[];
};

/** Tap a word to fill the selected (or first empty) gap; tap a filled gap to return its word. */
export function ClozeBank({ question, parts, phase, result, onChange }: Props) {
  const gaps = parts.filter((p) => p.kind === "gap");
  const tiles = useMemo(
    () =>
      shuffle([
        ...gaps.map((g) => g.answers[0]!),
        ...(question.distractors ?? []),
      ]).map((word, id) => ({ id, word })),
    [question],
  );
  const [filled, setFilled] = useState<(number | null)[]>(() =>
    gaps.map(() => null),
  );
  const [selectedGap, setSelectedGap] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const done = phase === "feedback";

  const update = (next: (number | null)[]) => {
    setFilled(next);
    const complete = next.every((tile) => tile !== null);
    onChange(complete ? next.map((tile) => tiles[tile!]!.word) : null);
  };

  const placeTile = (tileId: number) => {
    const target = selectedGap ?? filled.indexOf(null);
    if (target < 0) return;
    const next = [...filled];
    next[target] = tileId;
    update(next);
    setSelectedGap(null);
    // The used tile gets disabled; keep keyboard focus in the bank (or on the gap when the bank is empty).
    const following = tiles.find(
      (t) => t.id !== tileId && !next.includes(t.id),
    );
    requestAnimationFrame(() => {
      const selector = following
        ? `[data-tile="${following.id}"]`
        : `[data-gap="${target}"]`;
      rootRef.current?.querySelector<HTMLElement>(selector)?.focus();
    });
  };

  const tapGap = (gapIndex: number) => {
    if (filled[gapIndex] !== null) {
      const next = [...filled];
      next[gapIndex] = null;
      update(next);
    }
    setSelectedGap(selectedGap === gapIndex ? null : gapIndex);
  };

  let gapIndex = -1;
  return (
    <div ref={rootRef} class={styles.bankLayout}>
      <p class={`${styles.text} content`}>
        {parts.map((part, i) => {
          if (part.kind === "text")
            return <Fragment key={i}>{part.text}</Fragment>;
          const g = ++gapIndex;
          const tile = filled[g];
          const word =
            tile === null || tile === undefined ? null : tiles[tile]!.word;
          return (
            <button
              key={i}
              type="button"
              class={styles.gap}
              data-gap={g}
              data-state={
                result
                  ? result.parts?.[g]
                    ? "correct"
                    : "incorrect"
                  : undefined
              }
              aria-pressed={
                !done && word === null ? selectedGap === g : undefined
              }
              aria-label={`Lücke ${g + 1} von ${gaps.length}: ${word ?? "leer"}`}
              disabled={done}
              onClick={() => tapGap(g)}
            >
              {word ?? "\u00a0"}
              {result && <GapMark correct={result.parts?.[g] ?? false} />}
            </button>
          );
        })}
      </p>
      <div class={styles.bank} role="group" aria-label="Wörter">
        {tiles.map((tile) => {
          const used = filled.includes(tile.id);
          return (
            <button
              key={tile.id}
              type="button"
              class={`${styles.tile} content`}
              data-tile={tile.id}
              data-used={used || undefined}
              disabled={done || used}
              onClick={() => placeTile(tile.id)}
            >
              {tile.word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
