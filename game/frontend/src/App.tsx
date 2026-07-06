import { GameCanvas } from "./components/GameCanvas";
import { HUD } from "./components/HUD";
import { QuestionOverlay } from "./components/QuestionOverlay";
import { useGameSession } from "./hooks/useGameSession";

export default function App() {
  const { phase, state, lastCorrect, submitting, onSceneReady, answer, restart } =
    useGameSession();

  return (
    <div className="flex h-full min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="shrink-0 border-b border-slate-700/50 px-4 py-3 text-center">
        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent">
          🏃 English Runner
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Answer English questions to run faster!
        </p>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center p-2 sm:p-4">
        {phase === "loading" && (
          <p className="text-slate-400 animate-pulse">Loading game…</p>
        )}

        {state && phase !== "loading" && (
          <div className="relative w-full max-w-4xl">
            <GameCanvas onReady={onSceneReady} />
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
                    lastCorrect
                      ? "bg-green-600/90 border border-green-400"
                      : "bg-red-600/90 border border-red-400"
                  }`}
                >
                  <p className="text-2xl font-bold">
                    {lastCorrect ? "✅ Correct! Speed boost!" : "❌ Wrong! Slowing down…"}
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-white/90">
                    {state.last_explanation}
                  </p>
                </div>
              </div>
            )}

            {phase === "gameover" && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="rounded-2xl bg-slate-900 p-6 sm:p-8 text-center border border-orange-500/50 shadow-2xl max-w-sm mx-4">
                  <p className="text-3xl font-bold text-red-400">Game Over</p>
                  <p className="mt-2 text-4xl font-bold text-yellow-300">{state.score}</p>
                  <p className="text-sm text-slate-400">Final Score</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-800 p-2">
                      <p className="text-slate-400">Correct</p>
                      <p className="font-bold text-green-400">{state.correct_count}</p>
                    </div>
                    <div className="rounded-lg bg-slate-800 p-2">
                      <p className="text-slate-400">Accuracy</p>
                      <p className="font-bold text-sky-400">
                        {state.questions_answered
                          ? Math.round((state.correct_count / state.questions_answered) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={restart}
                    className="mt-6 w-full rounded-xl bg-orange-500 py-3 font-bold text-white hover:bg-orange-400 active:scale-[0.98] transition"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="shrink-0 py-2 text-center text-[10px] text-slate-600">
        AI-powered English learning · React + Phaser + FastAPI
      </footer>
    </div>
  );
}
