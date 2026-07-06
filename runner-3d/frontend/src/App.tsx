import { GameScene } from "./three/GameScene";
import { HUD } from "./components/HUD";
import { FloatingQuestionCard } from "./components/FloatingQuestionCard";
import { GameEffects } from "./components/GameEffects";
import { GameNavbar } from "./components/GameNavbar";
import { useGameManager } from "./hooks/useGameManager";
import { th, levelLabel } from "./lib/i18n";
import type { PerformanceEvaluation } from "./types";

export default function App() {
  const {
    phase,
    state,
    animState,
    scrollZ,
    obstacles,
    jumpHeight,
    evaluation,
    submitting,
    fx,
    answerFeedback,
    combo,
    answer,
    restart,
  } = useGameManager();

  const showQuestion = Boolean(state?.current_question) && phase === "running";

  return (
    <div className="flex h-full min-h-screen flex-col bg-slate-900">
      <GameNavbar />

      <header className="shrink-0 px-4 py-2 text-center">
        <h1 className="text-lg font-bold text-violet-300 sm:text-xl">🏃 {th.game.title}</h1>
        <p className="text-xs text-slate-400">{th.game.subtitle}</p>
      </header>

      <main className="relative flex-1">
        {phase === "loading" && (
          <p className="flex h-full items-center justify-center text-slate-400 animate-pulse">
            {th.game.loading}
          </p>
        )}

        {state && phase !== "loading" && (
          <div className="relative h-[calc(100vh-168px)] min-h-[280px]">
            <GameScene
              speed={state.speed}
              animState={animState}
              scrollZ={scrollZ}
              obstacles={obstacles}
              jumpHeight={jumpHeight}
              fx={fx}
            />
            <GameEffects fx={fx} />
            <HUD state={state} combo={combo} />

            {showQuestion && state.current_question && (
              <FloatingQuestionCard
                question={state.current_question}
                onAnswer={answer}
                disabled={submitting}
                feedback={answerFeedback}
              />
            )}

            {phase === "gameover" && (
              <GameOverModal
                state={state}
                evaluation={evaluation}
                onRestart={restart}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function GameOverModal({
  state,
  evaluation,
  onRestart,
}: {
  state: { score: number; correct_count: number; questions_answered: number };
  evaluation: PerformanceEvaluation | null;
  onRestart: () => void;
}) {
  const acc =
    state.questions_answered > 0
      ? Math.round((state.correct_count / state.questions_answered) * 100)
      : 0;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-500/40 bg-slate-900 p-6 text-center shadow-2xl max-w-md w-full">
        <p className="text-2xl font-bold text-red-400">{th.game.raceOver}</p>
        <p className="text-4xl font-bold text-yellow-300">{state.score}</p>
        <p className="text-sm text-slate-400">
          {th.game.accuracy}: {acc}%
        </p>

        {evaluation && (
          <div className="mt-4 rounded-xl bg-slate-800 p-4 text-left text-sm">
            <p className="font-semibold text-violet-300">{th.game.aiReport}</p>
            <p className="mt-2 leading-relaxed text-slate-200">{evaluation.summary}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
              <span>
                {th.game.overall}: {evaluation.overall}
              </span>
              <span>
                {th.game.level}: {levelLabel(evaluation.level)}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onRestart}
          className="mt-6 w-full rounded-xl bg-violet-500 py-3 font-bold hover:bg-violet-400"
        >
          {th.game.raceAgain}
        </button>
      </div>
    </div>
  );
}
