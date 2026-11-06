import { useEffect } from "preact/hooks";

// Below this difference between layout and visual viewport height we treat the on-screen keyboard as open.
const KEYBOARD_THRESHOLD_PX = 120;

/**
 * Mirrors the visual viewport into CSS variables so fixed layouts sit above the on-screen keyboard.
 * iOS Safari keeps the layout viewport when the keyboard opens and may pan the page; `--app-offset`
 * compensates for that pan. Without `visualViewport` the CSS falls back to 100dvh.
 */
export function useVisualViewport(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;

    const update = () => {
      root.style.setProperty("--app-height", `${viewport.height}px`);
      root.style.setProperty("--app-offset", `${viewport.offsetTop}px`);
      root.toggleAttribute(
        "data-keyboard-open",
        window.innerHeight - viewport.height > KEYBOARD_THRESHOLD_PX,
      );
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      root.style.removeProperty("--app-height");
      root.style.removeProperty("--app-offset");
      root.removeAttribute("data-keyboard-open");
    };
  }, []);
}
