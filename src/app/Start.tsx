import { useLayoutEffect, useRef, useState } from "preact/hooks";
import {
  loadSources,
  saveSources,
  type SourceEntry,
} from "../storage/sources.ts";
import { Page } from "../ui/Page.tsx";
import { CrossIcon } from "../ui/icons.tsx";
import { parseHash } from "./hash.ts";
import { BackupControls } from "./BackupControls.tsx";
import { OverallStats } from "./OverallStats.tsx";
import { loadActivity } from "../storage/activity.ts";
import styles from "./Start.module.css";

/** Accepts a quiz file URL or a full app link (…#src=…); returns the hash to open, or null. */
export function linkToHash(input: string, dev: boolean): string | null {
  const value = input.trim();
  const hashIndex = value.indexOf("#src=");
  const hash =
    hashIndex >= 0
      ? value.slice(hashIndex)
      : `#src=${encodeURIComponent(value)}`;
  return parseHash(hash, { dev }).src ? hash : null;
}

export function formatLastUsed(
  timestamp: number,
  now: Date = new Date(),
): string {
  const day = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(now) - day(new Date(timestamp))) / 86_400_000);
  if (days <= 0) return "heute";
  if (days === 1) return "gestern";
  return new Date(timestamp).toLocaleDateString("de-DE");
}

export function Start() {
  const [sources, setSources] = useState<SourceEntry[]>(loadSources);
  const [activity, setActivity] = useState(loadActivity);
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fieldRef = useRef<HTMLInputElement>(null);

  // First visit: the link field is the only thing to do here.
  useLayoutEffect(() => {
    if (sources.length === 0) fieldRef.current?.focus();
  }, []);

  const open = (event: Event) => {
    event.preventDefault();
    const hash = linkToHash(link, import.meta.env.DEV);
    if (hash) location.hash = hash;
    else
      setError(
        "Das ist kein gültiger Quiz-Link. Er muss mit https:// beginnen.",
      );
  };

  const remove = (entry: SourceEntry) => {
    if (
      !confirm(
        `„${entry.title}“ aus der Liste entfernen? Dein Fortschritt bleibt gespeichert.`,
      )
    )
      return;
    const next = sources.filter((s) => s.url !== entry.url);
    saveSources(next);
    setSources(next);
  };

  return (
    <Page>
      <h1>Lernquiz</h1>
      {sources.length === 0 && (
        <p>
          Hier übst du mit Quiz-Links, die du von deiner Lehrkraft oder aus
          deiner Klasse bekommst. Öffne den Link direkt oder füge ihn unten ein.
          Dein Fortschritt wird nur auf diesem Gerät gespeichert.
        </p>
      )}
      <form class={styles.form} onSubmit={open} noValidate>
        <label class={styles.label} for="quiz-link">
          Quiz-Link einfügen
        </label>
        <div class={styles.row}>
          <input
            id="quiz-link"
            class="text-input"
            type="url"
            inputMode="url"
            autocapitalize="off"
            autocorrect="off"
            spellcheck={false}
            enterKeyHint="go"
            ref={fieldRef}
            placeholder="https://…"
            value={link}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "quiz-link-error" : undefined}
            onInput={(e) => {
              setLink(e.currentTarget.value);
              setError(null);
            }}
          />
          <button type="submit" class="btn btn-primary" disabled={!link.trim()}>
            Öffnen
          </button>
        </div>
        {error && (
          <p id="quiz-link-error" class="text-incorrect" role="alert">
            {error}
          </p>
        )}
      </form>
      {sources.length > 0 && (
        <section class={styles.section} aria-labelledby="recent-title">
          <h2 id="recent-title">Zuletzt geöffnet</h2>
          <ul class={styles.list}>
            {sources.map((entry) => (
              <li key={entry.url} class={styles.item}>
                <a
                  class={styles.link}
                  href={`#src=${encodeURIComponent(entry.url)}`}
                >
                  <span class={styles.title}>{entry.title}</span>
                  <span class="text-muted">
                    {entry.mastered} / {entry.total} gemeistert ·{" "}
                    {formatLastUsed(entry.lastUsed)}
                  </span>
                </a>
                <button
                  type="button"
                  class={styles.remove}
                  aria-label={`„${entry.title}“ aus der Liste entfernen`}
                  onClick={() => remove(entry)}
                >
                  <CrossIcon />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <OverallStats activity={activity} />
      <BackupControls
        onRestored={() => {
          setSources(loadSources());
          setActivity(loadActivity());
        }}
      />
    </Page>
  );
}
