import { Fragment } from "preact";
import styles from "./Prompt.module.css";

/** Question text; `___` (2+ underscores) renders as a visual blank announced as "Lücke". */
export function Prompt({ text }: { text: string }) {
  const pieces = text.split(/_{2,}/);
  return (
    <p class={`${styles.prompt} content`}>
      {pieces.map((piece, i) => (
        <Fragment key={i}>
          {piece}
          {i < pieces.length - 1 && (
            <span class={styles.blank}>
              <span class="visually-hidden">Lücke</span>
            </span>
          )}
        </Fragment>
      ))}
    </p>
  );
}
