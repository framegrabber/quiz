import { render } from "preact";
import "./styles/tokens.css";
import "./styles/base.css";

function App() {
  return (
    <main>
      <h1>Quiz</h1>
    </main>
  );
}

const root = document.getElementById("app")!;

// Dynamic on purpose: a static import would ship the preview's CSS in production builds.
if (import.meta.env.DEV && location.hash === "#preview") {
  const { TokenPreview } = await import("./dev/TokenPreview.tsx");
  render(<TokenPreview />, root);
} else {
  render(<App />, root);
}
