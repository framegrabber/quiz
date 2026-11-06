// Dev-only token preview (open /quiz/#preview). Temporary: removed in T9.
import { CheckIcon, CrossIcon } from "../ui/icons.tsx";
import "./tokenPreview.css";

const colors = [
  "bg",
  "surface",
  "sunken",
  "text",
  "text-muted",
  "border",
  "border-strong",
  "accent",
  "on-accent",
  "accent-subtle",
  "correct",
  "correct-subtle",
  "incorrect",
  "incorrect-subtle",
];

export function TokenPreview() {
  return (
    <main class="preview">
      <h1>Design-Tokens</h1>

      <section>
        <h2>Farben</h2>
        <ul class="swatches">
          {colors.map((c) => (
            <li key={c}>
              <span
                class="swatch"
                style={{ background: `var(--color-${c})` }}
              />
              <code>--color-{c}</code>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Frage</h2>
        <p class="preview-prompt content" lang="en">
          The cat is playing with ___ ball.
        </p>
        <div class="stack">
          <button class="option" type="button">
            his
          </button>
          <button class="option" type="button" aria-pressed="true">
            its
          </button>
          <button class="option" type="button" data-state="correct" disabled>
            its
            <span class="option-mark text-correct">
              <CheckIcon />
            </span>
          </button>
          <button class="option" type="button" data-state="incorrect" disabled>
            it's
            <span class="option-mark text-incorrect">
              <CrossIcon />
            </span>
          </button>
        </div>
      </section>

      <section>
        <h2>Eingabe</h2>
        <label class="stack">
          <span>Deine Antwort</span>
          <input
            class="text-input"
            autocapitalize="off"
            autocorrect="off"
            autocomplete="off"
            spellcheck={false}
            enterKeyHint="done"
          />
        </label>
        <input
          class="text-input"
          readOnly
          value="their"
          aria-label="Antwort (gesperrt)"
        />
      </section>

      <section>
        <h2>Rückmeldung</h2>
        <p class="feedback text-correct">
          <CheckIcon /> <strong>Richtig</strong>
        </p>
        <p class="feedback text-incorrect">
          <CrossIcon /> <strong>Falsch</strong>
          <span class="text-muted">Lösung: its</span>
        </p>
        <p class="text-muted">its = sein/ihr (Besitz). it's = it is.</p>
      </section>

      <section class="stack">
        <h2>Buttons</h2>
        <button class="btn btn-primary btn-block" type="button">
          Weiter
        </button>
        <button class="btn btn-primary btn-block" type="button" disabled>
          Antwort abgeben
        </button>
        <button class="btn btn-secondary btn-block" type="button">
          Link teilen
        </button>
      </section>
    </main>
  );
}
