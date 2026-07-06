import type { GameState } from "../types";

interface Props {
  state: GameState;
}

export function HUD({ state }: Props) {
  const hpPercent = Math.max(0, Math.min(100, state.hp));
  const progressPercent = Math.min(100, (state.questions_answered / 20) * 100);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 sm:p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-2">
        {/* Score row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2 sm:gap-4">
            <StatBadge label="Score" value={state.score} color="text-yellow-300" />
            <StatBadge label="Streak" value={`🔥 ${state.streak}`} color="text-orange-300" />
            <StatBadge label="Speed" value={state.speed} color="text-sky-300" />
          </div>
          <StatBadge label="Level" value={state.difficulty} color="text-emerald-300" />
        </div>

        {/* HP bar */}
        <div className="flex items-center gap-2">
          <span className="w-8 text-xs font-bold text-red-400">HP</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${hpPercent}%`,
                backgroundColor: hpPercent > 40 ? "#22c55e" : hpPercent > 20 ? "#eab308" : "#ef4444",
              }}
            />
          </div>
          <span className="w-10 text-right text-xs text-slate-300">{state.hp}</span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <span className="w-8 text-xs font-bold text-blue-400">GO</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs text-slate-400">{state.questions_answered}/20</span>
        </div>
      </div>
    </div>
  );
}

function StatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-black/50 px-2 py-1 sm:px-3 backdrop-blur">
      <span className="text-[10px] uppercase text-slate-400">{label}</span>
      <p className={`text-sm sm:text-base font-bold ${color}`}>{value}</p>
    </div>
  );
}
