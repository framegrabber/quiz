import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  applyAnswer,
  countMastered,
  type QuizProgress,
} from "../engine/mastery.ts";
import { selectRound, type RoundSize } from "../engine/selectRound.ts";
import { shuffle } from "../engine/shuffle.ts";
import { missedQuestions } from "../engine/stats.ts";
import { questionId } from "../format/questionId.ts";
import type { Quiz } from "../format/schema.ts";
import type { Question } from "../question-types/definitions.ts";
import { countRound, loadRounds, recordActivity } from "../storage/activity.ts";
import { loadProgress, saveProgress } from "../storage/progress.ts";
import { loadSources, saveSources, upsertSource } from "../storage/sources.ts";
import { requestPersistence } from "../storage/store.ts";
import type { HashParams } from "./hash.ts";
import { Overview } from "./Overview.tsx";
import { Result } from "./Result.tsx";
import { Round, type AnsweredQuestion } from "./round/Round.tsx";
import {
  buildHash,
  resolveCategories,
  resolveRoundSize,
} from "./roundSettings.ts";

/** A round lives in its own history entry, so back/swipe-back returns to the overview. */
const ROUND_STATE = { quizRound: true };

type Play =
  | {
      phase: "round";
      questions: Question[];
      id: number;
      masteredBefore: number;
    }
  | { phase: "result"; answered: AnsweredQuestion[]; masteredBefore: number };

interface QuizScreenProps {
  src: string;
  quiz: Quiz;
  params: HashParams;
}

/** A loaded quiz: overview, rounds, results, and the student's progress for it. */
export function QuizScreen({ src, quiz, params }: QuizScreenProps) {
  const [progress, setProgress] = useState<QuizProgress>(() =>
    loadProgress(src),
  );
  const progressRef = useRef(progress);
  const linkCategories = useMemo(
    () => resolveCategories(params.cats, quiz),
    [quiz],
  );
  const [categories, setCategories] = useState(linkCategories.selected);
  const [size, setSize] = useState<RoundSize>(() =>
    resolveRoundSize(
      params.n,
      loadSources().find((s) => s.url === src)?.roundSize,
      quiz.roundSize,
    ),
  );

  // The URL always reflects the overview state, so it is the share link (no new history entry).
  useEffect(() => {
    history.replaceState(history.state, "", buildHash(src, categories, size));
  }, [categories, size]);

  const changeSize = (next: RoundSize) => {
    setSize(next);
    saveSources(
      upsertSource(loadSources(), { url: src, roundSize: next }, Date.now()),
    );
  };
  const [play, setPlay] = useState<Play | null>(null);
  const [rounds, setRounds] = useState(() => loadRounds(src));

  const pool = categories
    ? quiz.questions.filter((q) => categories.includes(q.category))
    : quiz.questions;

  const rememberSource = (current: QuizProgress) =>
    saveSources(
      upsertSource(
        loadSources(),
        {
          url: src,
          title: quiz.title,
          total: quiz.questions.length,
          mastered: countMastered(quiz.questions, current),
        },
        Date.now(),
      ),
    );

  useEffect(() => {
    rememberSource(progressRef.current);
    const onPopState = (event: PopStateEvent) => {
      if (!event.state?.quizRound) setPlay(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const recordAnswer = ({ question, result }: AnsweredQuestion) => {
    const id = questionId(question);
    const next = {
      ...progressRef.current,
      [id]: applyAnswer(progressRef.current[id], result.correct, Date.now()),
    };
    progressRef.current = next;
    setProgress(next);
    saveProgress(src, next);
    rememberSource(next);
    recordActivity({ answers: 1, correct: result.correct ? 1 : 0 });
  };

  const finishRound = (
    answered: AnsweredQuestion[],
    masteredBefore: number,
  ) => {
    requestPersistence();
    countRound(src);
    recordActivity({ rounds: 1 });
    setRounds(loadRounds(src));
    setPlay({ phase: "result", answered, masteredBefore });
  };

  const limit = (questions: Question[]) =>
    size === "all" ? questions : questions.slice(0, size);
  const newRound = (questions = selectRound(pool, progressRef.current, size)) =>
    setPlay({
      phase: "round",
      questions,
      id: Date.now(),
      masteredBefore: countMastered(pool, progressRef.current),
    });
  const startRound = (questions?: Question[]) => {
    history.pushState(ROUND_STATE, "");
    newRound(questions);
  };
  const practiceMistakes = () =>
    startRound(
      shuffle(
        limit(
          missedQuestions(pool, progressRef.current).map((m) => m.question),
        ),
      ),
    );
  // Leave via history so the round entry is popped; popstate then shows the overview.
  const leaveRound = () => history.back();

  if (play?.phase === "round") {
    return (
      <Round
        key={play.id}
        questions={play.questions}
        language={quiz.language}
        onAnswer={recordAnswer}
        onFinish={(answered) => finishRound(answered, play.masteredBefore)}
        onExit={leaveRound}
      />
    );
  }
  if (play?.phase === "result") {
    return (
      <Result
        answered={play.answered}
        language={quiz.language}
        mastery={{
          before: play.masteredBefore,
          after: countMastered(pool, progress),
          total: pool.length,
        }}
        onAgain={() => newRound()}
        onOverview={leaveRound}
      />
    );
  }

  const notices = [
    ...params.problems,
    ...(linkCategories.unknown.length
      ? [
          `Kategorie „${linkCategories.unknown.join(", ")}“ gibt es in diesem Quiz nicht. Alle Kategorien sind ausgewählt.`,
        ]
      : []),
  ];
  return (
    <Overview
      quiz={quiz}
      progress={progress}
      selected={categories}
      size={size}
      notices={notices}
      onSelectedChange={setCategories}
      onSizeChange={changeSize}
      rounds={rounds}
      onStart={() => startRound()}
      onPracticeMistakes={practiceMistakes}
    />
  );
}
