import { cleanup } from "@testing-library/preact";
import { afterEach } from "vitest";

// Vitest runs without globals, so Testing Library's auto-cleanup does not register itself.
afterEach(() => {
  cleanup();
  history.replaceState(null, "", "/");
});
