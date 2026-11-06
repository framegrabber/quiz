import { render } from "preact";
import "./styles/tokens.css";
import "./styles/base.css";
import { App } from "./app/App.tsx";

const root = document.getElementById("app")!;

// Dynamic on purpose: static imports would ship the dev screens' CSS in production builds.
if (import.meta.env.DEV && location.hash === "#preview") {
  const { TokenPreview } = await import("./dev/TokenPreview.tsx");
  render(<TokenPreview />, root);
} else if (import.meta.env.DEV && /^#spike-[ab]$/.test(location.hash)) {
  const { LayoutSpike } = await import("./dev/LayoutSpike.tsx");
  render(<LayoutSpike mode={location.hash.endsWith("a") ? "a" : "b"} />, root);
} else {
  render(<App />, root);
}
