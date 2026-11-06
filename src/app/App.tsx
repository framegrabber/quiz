import { useEffect, useState } from "preact/hooks";
import { parseHash } from "./hash.ts";
import { loadQuiz, type LoadResult } from "./load.ts";
import { ErrorScreen } from "./ErrorScreen.tsx";
import { OverviewPlaceholder } from "./Overview.tsx";
import { QuizScreen } from "./QuizScreen.tsx";
import { Start } from "./Start.tsx";

const readHash = () => parseHash(location.hash, { dev: import.meta.env.DEV });

/** Routes by the URL hash: start screen, loading, errors, or a loaded quiz. */
export function App() {
  const [params, setParams] = useState(readHash);
  const [load, setLoad] = useState<{ src: string; result?: LoadResult } | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const onHashChange = () => setParams(readHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const { src } = params;
    if (!src) return;
    let current = true;
    setLoad({ src });
    loadQuiz(src).then((result) => current && setLoad({ src, result }));
    return () => {
      current = false;
    };
  }, [params.src, attempt]);

  const goHome = () => {
    location.hash = "";
  };

  if (params.srcRejected)
    return <ErrorScreen error={{ kind: "url" }} onHome={goHome} />;
  if (!params.src) return <Start />;

  const result = load?.src === params.src ? load.result : undefined;
  if (!result) return <OverviewPlaceholder />;
  if (!result.ok) {
    return (
      <ErrorScreen
        error={result.error}
        onRetry={() => setAttempt(attempt + 1)}
        onHome={goHome}
      />
    );
  }
  return (
    <QuizScreen
      key={`${params.src}#${attempt}`}
      src={params.src}
      quiz={result.quiz}
      params={params}
    />
  );
}
