import type { GameState } from "../types";
import { TARGET_QUESTIONS } from "../game/constants";
import { th } from "../lib/i18n";

export function HUD({
  state,
  combo,
}: {
  state: GameState;
  combo: number;
}) {
  const hpPct = Math.max(0, state.hp);
  const progress = Math.min(100, (state.questions_answered / TARGET_QUESTIONS) * 100);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <Badge label={th.game.score} value={state.score} className="text-yellow-300" />
          <Badge
            label={th.game.speed}
            value={`${state.speed.toFixed(1)}`}
            className="text-sky-300"
          />
          <Badge
            label="Combo"
            value={combo > 1 ? `🔥 x${combo}` : "—"}
            className="text-orange-300"
          />
          <Badge
            label={th.game.questions}
            value={`${state.questions_answered}/${TARGET_QUESTIONS}`}
            className="text-violet-300"
          />
        </div>
        <Bar label={th.game.hp} value={hpPct} max={100} color="#22c55e" />
        <Bar label={th.game.race} value={progress} max={100} color="#a78bfa" />
      </div>
    </div>
  );
}

function Badge({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className: string;
}) {
  return (
    <div className="rounded-lg bg-black/50 px-3 py-1 backdrop-blur">
      <p className="text-[10px] text-slate-300">{label}</p>
      <p className={`font-bold ${className}`}>{value}</p>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-xs font-bold text-slate-300">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800/80">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
