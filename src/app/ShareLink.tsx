import { useState } from "preact/hooks";
import { shareLink, type ShareOutcome } from "./share.ts";
import styles from "./Overview.module.css";

/** "Link teilen" for the current URL (which always holds the overview state). */
export function ShareLink({ title }: { title: string }) {
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const [url, setUrl] = useState("");

  const share = async () => {
    const current = location.href;
    setUrl(current);
    setOutcome(await shareLink(current, title));
  };

  return (
    <>
      <button type="button" class="btn btn-secondary btn-block" onClick={share}>
        Link teilen
      </button>
      <div aria-live="polite">
        {outcome === "copied" && (
          <p class="text-muted">Link kopiert – du kannst ihn jetzt einfügen.</p>
        )}
        {outcome === "manual" && (
          <label class={styles.manualShare}>
            <span>Kopiere diesen Link:</span>
            <input
              class="text-input wrap-anywhere"
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
        )}
      </div>
    </>
  );
}
