import { useEffect, useState } from "preact/hooks";
import { hasWriteFailed, onWriteFailure } from "../storage/store.ts";
import styles from "./Page.module.css";

/** Persistent notice once saving failed; the quiz stays playable. */
export function StorageBanner() {
  const [failed, setFailed] = useState(hasWriteFailed);
  useEffect(() => onWriteFailure(() => setFailed(true)), []);
  if (!failed) return null;
  return (
    <p class={styles.banner} role="status">
      Fortschritt wird nicht gespeichert. Der Browser erlaubt gerade kein
      Speichern (z. B. privater Modus oder voller Speicher).
    </p>
  );
}
