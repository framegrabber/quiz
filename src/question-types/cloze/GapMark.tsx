import { CheckIcon, CrossIcon } from "../../ui/icons.tsx";

/** Per-gap feedback: icon plus hidden text, never color alone. */
export function GapMark({ correct }: { correct: boolean }) {
  return (
    <span class={correct ? "text-correct" : "text-incorrect"}>
      {correct ? <CheckIcon size={16} /> : <CrossIcon size={16} />}
      <span class="visually-hidden">{correct ? "richtig" : "falsch"}</span>
    </span>
  );
}
