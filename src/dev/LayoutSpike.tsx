// Dev-only T3 spike (open /quiz/#spike-a or #spike-b). Temporary: replaced by the real round in T9.
// a: one input element reused across typed questions. b: a new input per question, focused after render.
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { RoundLayout, keepFocus } from "../ui/RoundLayout.tsx";
import { CheckIcon, CrossIcon } from "../ui/icons.tsx";
import { answersMatch } from "../engine/normalize.ts";
import "./tokenPreview.css";

type Question =
  | { id: string; type: "input"; prompt: string; answer: string }
  | {
      id: string;
      type: "choice";
      prompt: string;
      options: string[];
      answer: string;
    };

const questions: Question[] = [
  {
    id: "q1",
    type: "input",
    prompt: "Tom and Lisa love ___ dog.",
    answer: "their",
  },
  {
    id: "q2",
    type: "input",
    prompt: "I can't find ___ pencil. Can you help me?",
    answer: "my",
  },
  {
    id: "q3",
    type: "choice",
    prompt: "The cat is playing with ___ ball.",
    options: ["its", "it's", "his", "their"],
    answer: "its",
  },
  {
    id: "q4",
    type: "input",
    prompt: "We love ___ new teacher.",
    answer: "our",
  },
];

export function LayoutSpike({ mode }: { mode: "a" | "b" }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const question = questions[index % questions.length]!;
  const phase = result === null ? "answering" : "feedback";
  const [debug, setDebug] = useState("");

  useLayoutEffect(() => {
    const report = (event?: Event) => {
      const v = window.visualViewport!;
      const tap =
        event instanceof PointerEvent
          ? `tap ${event.clientX},${event.clientY} `
          : "";
      const active = document.activeElement?.tagName ?? "-";
      setDebug(
        `${tap}vv ${Math.round(v.height)}/${innerHeight} off ${Math.round(v.offsetTop)} ${active}`,
      );
    };
    report();
    window.addEventListener("pointerdown", report, true);
    window.visualViewport!.addEventListener("resize", () => report());
    document.addEventListener("focusin", () => report());
    document.addEventListener("focusout", () => setTimeout(report, 0));
  }, []);

  useLayoutEffect(() => {
    if (question.type === "input") {
      if (document.activeElement !== inputRef.current)
        inputRef.current?.focus();
    } else if (phase === "answering") {
      (document.activeElement as HTMLElement | null)?.blur();
    }
  }, [index]);

  useLayoutEffect(() => {
    if (phase === "feedback" && question.type === "choice")
      nextRef.current?.focus();
  }, [phase]);

  const submit = (given: string) =>
    setResult(answersMatch(given, question.answer));
  const next = () => {
    setResult(null);
    setValue("");
    setIndex(index + 1);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (phase === "feedback") next();
    else if (value.trim()) submit(value);
  };

  const input = (
    <input
      ref={inputRef}
      key={mode === "b" ? question.id : "shared"}
      class="text-input"
      aria-label="Deine Antwort"
      autocapitalize="off"
      autocorrect="off"
      autocomplete="off"
      spellcheck={false}
      enterKeyHint="done"
      readOnly={phase === "feedback"}
      value={value}
      onInput={(e) => setValue(e.currentTarget.value)}
      onKeyDown={onKeyDown}
    />
  );

  return (
    <RoundLayout
      header={
        <>
          <span>Spike {mode.toUpperCase()}</span>
          <span class="text-muted" style={{ fontSize: "var(--font-size-s)" }}>
            {debug}
          </span>
          <span class="text-muted">
            {(index % questions.length) + 1} / {questions.length}
          </span>
        </>
      }
      actions={
        <>
          <div aria-live="polite" class="feedback">
            {result === true && (
              <span class="feedback text-correct">
                <CheckIcon /> <strong>Richtig</strong>
              </span>
            )}
            {result === false && (
              <span class="feedback text-incorrect">
                <CrossIcon /> <strong>Falsch</strong>
                <span class="text-muted">Lösung: {question.answer}</span>
              </span>
            )}
          </div>
          {phase === "feedback" ? (
            <button
              ref={nextRef}
              class="btn btn-primary btn-block"
              onMouseDown={keepFocus}
              onClick={next}
            >
              Weiter
            </button>
          ) : (
            <button
              class="btn btn-primary btn-block"
              onMouseDown={keepFocus}
              disabled={question.type === "choice" || !value.trim()}
              onClick={() => submit(value)}
            >
              Antwort abgeben
            </button>
          )}
        </>
      }
    >
      <div class="stack">
        <p class="preview-prompt content" lang="en">
          {question.prompt}
        </p>
        {question.type === "input"
          ? input
          : question.options.map((option) => (
              <button
                key={option}
                class="option"
                disabled={phase === "feedback"}
                data-state={
                  phase === "feedback" && option === question.answer
                    ? "correct"
                    : undefined
                }
                onClick={() => submit(option)}
              >
                {option}
              </button>
            ))}
      </div>
    </RoundLayout>
  );
}
