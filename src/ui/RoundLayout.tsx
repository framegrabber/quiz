import type { ComponentChildren } from "preact";
import { useVisualViewport } from "./useVisualViewport.ts";
import styles from "./RoundLayout.module.css";

interface RoundLayoutProps {
  header: ComponentChildren;
  actions: ComponentChildren;
  children: ComponentChildren;
}

/** Fixed header · scrollable content · action bar, sized to the visible viewport (above the keyboard). */
export function RoundLayout({ header, actions, children }: RoundLayoutProps) {
  useVisualViewport();
  return (
    <div class={styles.layout}>
      <header class={styles.header}>
        <div class={`${styles.column} ${styles.headerInner}`}>{header}</div>
      </header>
      <main class={styles.content}>
        <div class={`${styles.column} ${styles.contentInner}`}>{children}</div>
      </main>
      <footer class={styles.actions}>
        <div class={`${styles.column} ${styles.actionsInner}`}>{actions}</div>
      </footer>
    </div>
  );
}

/** Keeps focus where it is (e.g. in a text field, so the iOS keyboard stays open) when tapped. */
export function keepFocus(event: Event): void {
  event.preventDefault();
}
