import type { Question } from "../types";

interface Props {
  question: Question;
  onAnswer: (index: number) => void;
  disabled?: boolean;
}

const LABELS = ["A", "B", "C", "D"];

export function QuestionOverlay({ question, onAnswer, disabled }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/50 p-3 sm:p-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900/95 p-4 sm:p-6 shadow-2xl border border-orange-500/40">
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-orange-500/20 px-3 py-0.5 text-xs font-medium uppercase text-orange-300">
            {question.difficulty}
          </span>
          <span className="text-xs text-slate-400">Answer to boost speed!</span>
        </div>
        <h2 className="mb-4 text-base sm:text-lg font-semibold leading-snug text-white">
          {question.question}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {question.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer(i)}
              className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-left text-sm transition hover:border-orange-400 hover:bg-slate-700 active:scale-[0.98] disabled:opacity-50"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                {LABELS[i]}
              </span>
              <span className="text-slate-100">{opt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
