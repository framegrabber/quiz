import type { LoadError } from "./load.ts";
import { Page } from "../ui/Page.tsx";

export type AppError = LoadError | { kind: "url" };

const MAX_LISTED = 10;

function describe(error: AppError): { title: string; text: string } {
  switch (error.kind) {
    case "url":
      return {
        title: "Ungültiger Quiz-Link",
        text: "Quiz-Links müssen mit https:// beginnen.",
      };
    case "http":
      return error.status === 404
        ? {
            title: "Quiz nicht gefunden",
            text: "Unter diesem Link gibt es keine Datei. Prüfe den Link.",
          }
        : {
            title: "Quiz konnte nicht geladen werden",
            text: `Der Server antwortete mit Fehler ${error.status}.`,
          };
    case "network":
      return {
        title: "Keine Verbindung",
        text: "Prüfe deine Internetverbindung und versuche es erneut.",
      };
    case "timeout":
      return {
        title: "Laden dauert zu lange",
        text: "Der Server hat nicht rechtzeitig geantwortet.",
      };
    case "json":
      return {
        title: "Das ist kein Quiz",
        text: "Die Datei unter diesem Link ist keine Quiz-Datei.",
      };
    case "invalid":
      return {
        title: "Das Quiz enthält Fehler",
        text: "Die Datei passt nicht zum Quiz-Format:",
      };
  }
}

interface ErrorScreenProps {
  error: AppError;
  onRetry?: () => void;
  onHome: () => void;
}

export function ErrorScreen({ error, onRetry, onHome }: ErrorScreenProps) {
  const { title, text } = describe(error);
  const errors = error.kind === "invalid" ? error.errors : [];
  const hidden = errors.length - MAX_LISTED;

  return (
    <Page
      actions={
        <>
          {onRetry && (
            <button
              type="button"
              class="btn btn-primary btn-block"
              onClick={onRetry}
            >
              Erneut versuchen
            </button>
          )}
          <button
            type="button"
            class="btn btn-secondary btn-block"
            onClick={onHome}
          >
            Zur Startseite
          </button>
        </>
      }
    >
      <h1>{title}</h1>
      <p>{text}</p>
      {errors.length > 0 && (
        <ul class="wrap-anywhere">
          {errors.slice(0, MAX_LISTED).map((e, i) => (
            <li key={i}>
              {e.path && <code>{e.path}</code>} {e.message}
            </li>
          ))}
          {hidden > 0 && <li class="text-muted">… und {hidden} weitere</li>}
        </ul>
      )}
    </Page>
  );
}
