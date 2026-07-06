import type { Question } from "../types";

interface Props {
  question: Question;
  onAnswer: (index: number) => void;
  disabled?: boolean;
}

const LABELS = ["A", "B", "C"];

export function QuestionOverlay({ question, onAnswer, disabled }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-violet-400/40 bg-slate-900/95 p-4 shadow-2xl">
        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs uppercase text-violet-300">
          {question.difficulty}
        </span>
        <h2 className="mt-2 text-base font-semibold leading-snug sm:text-lg">{question.question}</h2>
        <div className="mt-3 grid gap-2">
          {question.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer(i)}
              className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-left text-sm transition hover:border-violet-400 active:scale-[0.98] disabled:opacity-50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500 text-xs font-bold">
                {LABELS[i]}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
