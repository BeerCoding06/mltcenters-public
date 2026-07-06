import type { GameState } from "../types";

export function HUD({ state }: { state: GameState }) {
  const hpPct = Math.max(0, state.hp);
  const progress = Math.min(100, (state.questions_answered / 15) * 100);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <Badge label="Score" value={state.score} className="text-yellow-300" />
          <Badge label="Speed" value={`${state.speed.toFixed(1)} m/s`} className="text-sky-300" />
          <Badge label="Streak" value={`🔥 ${state.streak}`} className="text-orange-300" />
          <Badge label="Distance" value={`${Math.floor(state.distance)}m`} className="text-emerald-300" />
        </div>
        <Bar label="HP" value={hpPct} max={100} color="#22c55e" />
        <Bar label="Race" value={progress} max={100} color="#a78bfa" />
      </div>
    </div>
  );
}

function Badge({ label, value, className }: { label: string; value: string | number; className: string }) {
  return (
    <div className="rounded-lg bg-black/50 px-3 py-1 backdrop-blur">
      <p className="text-[10px] uppercase text-slate-400">{label}</p>
      <p className={`font-bold ${className}`}>{value}</p>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-xs font-bold text-slate-400">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800/80">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
