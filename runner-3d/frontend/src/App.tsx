import { GameScene } from "./three/GameScene";
import { HUD } from "./components/HUD";
import { QuestionOverlay } from "./components/QuestionOverlay";
import { useRunner3D } from "./hooks/useRunner3D";
import type { PerformanceEvaluation } from "./types";

export default function App() {
  const {
    phase,
    state,
    animState,
    scrollZ,
    playerZ,
    obstacles,
    evaluation,
    submitting,
    lastCorrect,
    answer,
    restart,
  } = useRunner3D();

  const paused = phase === "question" || phase === "feedback";

  return (
    <div className="flex h-full min-h-screen flex-col bg-gradient-to-b from-indigo-950 to-slate-950">
      <header className="shrink-0 px-4 py-2 text-center">
        <h1 className="text-lg font-bold text-violet-300 sm:text-xl">🏃 3D English Runner</h1>
        <p className="text-xs text-slate-400">Answer questions to run faster!</p>
      </header>

      <main className="relative flex-1">
        {phase === "loading" && (
          <p className="flex h-full items-center justify-center text-slate-400 animate-pulse">
            Starting race…
          </p>
        )}

        {state && phase !== "loading" && (
          <div className="relative h-[calc(100vh-120px)] min-h-[320px]">
            <GameScene
              speed={state.speed}
              animState={paused ? "idle" : animState}
              scrollZ={scrollZ}
              playerZ={playerZ}
              obstacles={obstacles}
            />
            <HUD state={state} />

            {phase === "question" && state.current_question && (
              <QuestionOverlay
                question={state.current_question}
                onAnswer={answer}
                disabled={submitting}
              />
            )}

            {phase === "feedback" && (
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                <div
                  className={`rounded-2xl px-6 py-4 text-center shadow-2xl ${
                    lastCorrect ? "bg-green-600/90" : "bg-red-600/90"
                  }`}
                >
                  <p className="text-xl font-bold">
                    {lastCorrect ? "✅ Correct! Speed boost!" : "❌ Wrong! Slowing down…"}
                  </p>
                  <p className="mt-1 max-w-xs text-sm">{state.last_explanation}</p>
                </div>
              </div>
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
        <p className="text-2xl font-bold text-red-400">Race Over</p>
        <p className="text-4xl font-bold text-yellow-300">{state.score}</p>
        <p className="text-sm text-slate-400">Accuracy: {acc}%</p>

        {evaluation && (
          <div className="mt-4 rounded-xl bg-slate-800 p-4 text-left text-sm">
            <p className="font-semibold text-violet-300">AI Performance Report</p>
            <p className="mt-1 text-slate-300">{evaluation.summary}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <span>Overall: {evaluation.overall}</span>
              <span>Level: {evaluation.level}</span>
              <span>Vocabulary: {evaluation.vocabulary}</span>
              <span>Grammar: {evaluation.grammar}</span>
            </div>
            {evaluation.improvements.length > 0 && (
              <ul className="mt-2 list-disc pl-4 text-slate-400">
                {evaluation.improvements.map((t: string, i: number) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onRestart}
          className="mt-6 w-full rounded-xl bg-violet-500 py-3 font-bold hover:bg-violet-400"
        >
          Race Again
        </button>
      </div>
    </div>
  );
}
