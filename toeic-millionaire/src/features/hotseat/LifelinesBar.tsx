"use client";

import { cn } from "@/lib/utils";

export type LifelineKind = "fifty" | "phone" | "swap" | "hint";

type LifelineItem = {
  kind: LifelineKind;
  label: string;
  desc: string;
  used: boolean;
  disabled: boolean;
  loading?: boolean;
  onClick: () => void;
};

type Props = {
  title: string;
  items: LifelineItem[];
};

/** Square gold-border lifeline icons in the Thai quiz-show style. */
export function LifelinesBar({ title, items }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--millionaire-gold)]/35 bg-black/60 px-3 py-3">
      <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--millionaire-gold)]">
        {title}
      </p>
      <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-4">
        {items.map((item) => (
          <button
            key={item.kind}
            type="button"
            disabled={item.disabled || item.loading}
            onClick={item.onClick}
            className={cn(
              "group flex w-[4.75rem] flex-col items-center gap-1.5 sm:w-[5.25rem]",
              "disabled:cursor-not-allowed",
            )}
            title={`${item.label} — ${item.desc}`}
            aria-label={item.label}
          >
            <span
              className={cn(
                "relative flex size-14 items-center justify-center rounded-md border-[1.5px] bg-black sm:size-16",
                "border-[var(--millionaire-gold)] shadow-[0_0_12px_rgb(251_191_36_/_18%)]",
                "transition group-hover:enabled:shadow-[0_0_18px_rgb(251_191_36_/_40%)] group-hover:enabled:brightness-110",
                "group-disabled:opacity-45",
                item.used && "border-[var(--millionaire-silver)]/50",
              )}
            >
              {item.loading ? (
                <span className="text-lg font-bold text-white">…</span>
              ) : (
                <LifelineIcon kind={item.kind} used={item.used} />
              )}
              {item.used ? (
                <span
                  className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/65"
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" className="size-8 text-[var(--millionaire-wrong)]" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </span>
              ) : null}
            </span>
            <span className="text-center text-[10px] font-semibold leading-tight text-[var(--millionaire-gold)] sm:text-[11px]">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LifelineIcon({ kind, used }: { kind: LifelineKind; used: boolean }) {
  const color = used ? "rgb(192 200 212 / 70%)" : "#ffffff";
  const common = { fill: "none", stroke: color, strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (kind === "fifty") {
    // Two checkmarks — classic 50:50 mark
    return (
      <svg viewBox="0 0 40 40" className="size-9" aria-hidden>
        <path d="M6 20l5 5 10-12" {...common} />
        <path d="M18 22l5 5 11-14" {...common} />
      </svg>
    );
  }

  if (kind === "phone") {
    // Friend silhouette
    return (
      <svg viewBox="0 0 40 40" className="size-9" aria-hidden>
        <circle cx="20" cy="13" r="6" fill={color} stroke="none" />
        <path
          d="M8 34c1.5-8 6.5-12 12-12s10.5 4 12 12"
          fill={color}
          stroke="none"
        />
      </svg>
    );
  }

  if (kind === "swap") {
    // Switch question — bold ?
    return (
      <svg viewBox="0 0 40 40" className="size-9" aria-hidden>
        <path
          d="M14 14c0-4 3.2-7 6.8-7S28 10 28 14c0 3.2-2 4.6-4.4 6.2-1.6 1-2.6 2-2.6 4.2"
          {...common}
          strokeWidth="2.4"
        />
        <circle cx="21" cy="30" r="1.8" fill={color} stroke="none" />
      </svg>
    );
  }

  // Hint — lightbulb
  return (
    <svg viewBox="0 0 40 40" className="size-9" aria-hidden>
      <path
        d="M20 6c-5 0-9 3.8-9 8.5 0 3.2 1.6 5.4 3.6 7.2.8.7 1.4 1.6 1.4 2.8v1h8v-1c0-1.2.6-2.1 1.4-2.8 2-1.8 3.6-4 3.6-7.2C29 9.8 25 6 20 6z"
        {...common}
        strokeWidth="2"
      />
      <path d="M16 28h8M17 31h6" {...common} strokeWidth="2" />
      <path d="M20 4v2M10 10l-1.5-1.5M30 10l1.5-1.5" {...common} strokeWidth="1.6" />
    </svg>
  );
}
