import { cleanup } from "@testing-library/preact";
import { afterEach, beforeEach, vi } from "vitest";

// No test reaches the network: fetch stays pending unless a test stubs it.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {})),
  );
});

// Vitest runs without globals, so Testing Library's auto-cleanup does not register itself.
afterEach(() => {
  cleanup();
  localStorage.clear();
  history.replaceState(null, "", "/");
  vi.unstubAllGlobals();
});
