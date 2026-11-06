import { useEffect, useState } from "preact/hooks";
import type { Quiz } from "../format/schema.ts";
import { shuffle } from "../engine/shuffle.ts";
import {
  isPlayable,
  type PlayableQuestion,
} from "../question-types/registry.tsx";
import { parseHash } from "./hash.ts";
import { loadQuiz, type LoadResult } from "./load.ts";
import { ErrorScreen } from "./ErrorScreen.tsx";
import { Overview } from "./Overview.tsx";
import { Result } from "./Result.tsx";
import { Round, type AnsweredQuestion } from "./round/Round.tsx";
import { Start } from "./Start.tsx";

const DEFAULT_ROUND_SIZE = 10;
const readHash = () => parseHash(location.hash, { dev: import.meta.env.DEV });

/** A round lives in its own history entry, so back/swipe-back returns to the overview. */
const ROUND_STATE = { quizRound: true };

type Play =
  | { phase: "round"; questions: PlayableQuestion[]; id: number }
  | { phase: "result"; answered: AnsweredQuestion[] };

export function App() {
  const [params, setParams] = useState(readHash);
  const [load, setLoad] = useState<{ src: string; result?: LoadResult } | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);
  const [play, setPlay] = useState<Play | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      setParams(readHash());
      setPlay(null);
    };
    const onPopState = (event: PopStateEvent) => {
      if (!event.state?.quizRound) setPlay(null);
    };
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onPopState);
    };
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
  if (!result) return <Overview quiz={null} onStart={() => {}} />;
  if (!result.ok) {
    return (
      <ErrorScreen
        error={result.error}
        onRetry={() => setAttempt(attempt + 1)}
        onHome={goHome}
      />
    );
  }

  const quiz: Quiz = result.quiz;
  const newRound = () => {
    const size =
      params.n === "all"
        ? Infinity
        : (params.n ?? quiz.roundSize ?? DEFAULT_ROUND_SIZE);
    const pool = quiz.questions.filter(isPlayable);
    setPlay({
      phase: "round",
      questions: shuffle(pool).slice(0, size),
      id: Date.now(),
    });
  };
  const startRound = () => {
    history.pushState(ROUND_STATE, "");
    newRound();
  };
  // Leave via history so the round entry is popped; popstate then shows the overview.
  const leaveRound = () => history.back();

  if (play?.phase === "round") {
    return (
      <Round
        key={play.id}
        questions={play.questions}
        language={quiz.language}
        onFinish={(answered) => setPlay({ phase: "result", answered })}
        onExit={leaveRound}
      />
    );
  }
  if (play?.phase === "result") {
    return (
      <Result
        answered={play.answered}
        language={quiz.language}
        onAgain={newRound}
        onOverview={leaveRound}
      />
    );
  }
  return (
    <Overview quiz={quiz} notices={params.problems} onStart={startRound} />
  );
}
