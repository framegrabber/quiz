import { useRef, useState } from "preact/hooks";
import {
  backupFileName,
  createBackup,
  parseBackup,
  restoreBackup,
} from "../storage/backup.ts";
import styles from "./Start.module.css";

type Status = { kind: "ok" | "error"; text: string } | null;

/** Export progress to a file and import it on another browser or in the home-screen app. */
export function BackupControls({ onRestored }: { onRestored: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(createBackup(), null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = backupFileName();
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus({ kind: "ok", text: "Fortschritt exportiert." });
  };

  const importProgress = async (file: File) => {
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) {
      setStatus({
        kind: "error",
        text: "Diese Datei ist keine Fortschritts-Sicherung. Es wurde nichts geändert.",
      });
      return;
    }
    if (!confirm("Vorhandenen Fortschritt ersetzen?")) return;
    if (restoreBackup(parsed.backup)) {
      setStatus({ kind: "ok", text: "Fortschritt importiert." });
      onRestored();
    } else {
      setStatus({
        kind: "error",
        text: "Der Fortschritt konnte nicht gespeichert werden.",
      });
    }
  };

  return (
    <section class={styles.section} aria-labelledby="backup-title">
      <h2 id="backup-title">Fortschritt sichern</h2>
      <p class="text-muted">
        Übertrage deinen Fortschritt in einen anderen Browser oder in die App
        auf dem Home-Bildschirm.
      </p>
      <div class={styles.backupButtons}>
        <button
          type="button"
          class="btn btn-secondary"
          onClick={exportProgress}
        >
          Exportieren
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          onClick={() => fileRef.current?.click()}
        >
          Importieren
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        aria-label="Sicherungsdatei wählen"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void importProgress(file);
        }}
      />
      {status && (
        <p
          class={status.kind === "error" ? "text-incorrect" : "text-muted"}
          role={status.kind === "error" ? "alert" : "status"}
        >
          {status.text}
        </p>
      )}
    </section>
  );
}
