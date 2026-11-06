import type { ComponentChildren } from "preact";
import { StorageBanner } from "./StorageBanner.tsx";
import styles from "./Page.module.css";

interface PageProps {
  /** Primary actions in a sticky bottom bar. */
  actions?: ComponentChildren;
  busy?: boolean;
  children: ComponentChildren;
}

/** Scrolling page with the content column and an optional sticky action bar. */
export function Page({ actions, busy, children }: PageProps) {
  return (
    <div class={styles.page}>
      <main
        class={`${styles.column} ${styles.main}`}
        aria-busy={busy || undefined}
      >
        <StorageBanner />
        {children}
      </main>
      {actions && (
        <footer class={styles.bar}>
          <div class={`${styles.column} ${styles.barInner}`}>{actions}</div>
        </footer>
      )}
    </div>
  );
}
