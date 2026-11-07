import { useEffect, useState } from "preact/hooks";
import { groupCatalog } from "../format/catalog.ts";
import type { SourceEntry } from "../storage/sources.ts";
import { loadCatalog, type CatalogLoadResult, type LoadError } from "./load.ts";
import styles from "./Start.module.css";

function describe(error: LoadError): string {
  switch (error.kind) {
    case "http":
      return error.status === 404
        ? "Der Katalog wurde nicht gefunden."
        : `Der Katalog konnte nicht geladen werden (Fehler ${error.status}).`;
    case "network":
      return "Der Katalog konnte nicht geladen werden. Prüfe deine Internetverbindung.";
    case "timeout":
      return "Der Katalog lädt zu lange.";
    case "json":
    case "invalid":
      return "Die Datei unter dem Katalog-Link ist kein gültiger Katalog.";
  }
}

interface CatalogProps {
  url: string;
  isDefault: boolean;
  sources: readonly SourceEntry[];
  onReset: () => void;
}

/** "Quizze entdecken": every quiz of the catalog, grouped by subject and book. */
export function Catalog({ url, isDefault, sources, onReset }: CatalogProps) {
  const [load, setLoad] = useState<{
    url: string;
    result: CatalogLoadResult;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoad(null);
    loadCatalog(url, { dev: import.meta.env.DEV }).then(
      (result) => current && setLoad({ url, result }),
    );
    return () => {
      current = false;
    };
  }, [url, attempt]);

  const result = load?.url === url ? load.result : null;

  return (
    <section class={styles.section} aria-labelledby="catalog-title">
      <h2 id="catalog-title">Quizze entdecken</h2>
      {!isDefault && (
        <div class={styles.customCatalog}>
          <p class="text-muted wrap-anywhere">Eigener Katalog: {url}</p>
          <button type="button" class="btn btn-secondary" onClick={onReset}>
            Standardkatalog verwenden
          </button>
        </div>
      )}
      {!result && <p class="text-muted">Katalog wird geladen …</p>}
      {result && !result.ok && (
        <div class={styles.customCatalog} role="alert">
          <p>{describe(result.error)}</p>
          <button
            type="button"
            class="btn btn-secondary"
            onClick={() => setAttempt(attempt + 1)}
          >
            Erneut versuchen
          </button>
        </div>
      )}
      {result?.ok &&
        groupCatalog(result.quizzes).map((group) => (
          <div key={group.label} class={styles.group}>
            <h3 class={styles.groupTitle}>{group.label}</h3>
            <ul class={styles.list}>
              {group.entries.map((quiz) => {
                const played = sources.find((s) => s.url === quiz.url);
                return (
                  <li key={quiz.url} class={styles.item}>
                    <a
                      class={styles.link}
                      href={`#src=${encodeURIComponent(quiz.url)}`}
                    >
                      <span class={styles.title}>{quiz.title}</span>
                      {quiz.description && <span>{quiz.description}</span>}
                      <span class="text-muted">
                        {played
                          ? `${played.mastered} / ${played.total} gemeistert`
                          : `${quiz.questions} Fragen`}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
    </section>
  );
}
