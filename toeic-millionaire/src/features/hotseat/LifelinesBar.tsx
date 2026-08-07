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
  title?: string;
  items: LifelineItem[];
  /** Vertical stack like the TV show (right rail). */
  orientation?: "vertical" | "horizontal";
};

/** Gold-border square lifeline icons — Thai quiz-show style. */
export function LifelinesBar({
  title,
  items,
  orientation = "vertical",
}: Props) {
  const vertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "flex",
        vertical ? "flex-col items-center gap-3" : "flex-col items-stretch gap-2",
      )}
    >
      {title ? (
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a227]">
          {title}
        </p>
      ) : null}
      <div
        className={cn(
          "flex gap-2 sm:gap-3",
          vertical ? "flex-col items-center" : "flex-row flex-nowrap justify-evenly",
        )}
      >
        {items.map((item) => (
          <button
            key={item.kind}
            type="button"
            disabled={item.disabled || item.loading}
            onClick={item.onClick}
            className={cn(
              "group flex flex-col items-center gap-1",
              "disabled:cursor-not-allowed",
            )}
            title={`${item.label} — ${item.desc}`}
            aria-label={item.label}
          >
            <span
              className={cn(
                "relative flex size-11 items-center justify-center rounded-[3px] border bg-black sm:size-14",
                "border-[#c9a227] shadow-[0_0_10px_rgb(201_162_39_/_25%)]",
                "transition group-hover:enabled:brightness-125",
                "group-disabled:opacity-40",
                item.used && "border-[#8a8a8a]",
              )}
            >
              {item.loading ? (
                <span className="text-base font-bold text-white">…</span>
              ) : (
                <LifelineIcon kind={item.kind} used={item.used} />
              )}
              {item.used ? (
                <span
                  className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/70"
                  aria-hidden
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-6 text-[#ef4444] sm:size-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </span>
              ) : null}
            </span>
            {!vertical ? (
              <span className="hidden max-w-[4.5rem] text-center text-[9px] leading-tight text-[#c9a227] sm:block">
                {item.label}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function LifelineIcon({ kind, used }: { kind: LifelineKind; used: boolean }) {
  const color = used ? "#9ca3af" : "#ffffff";
  const common = {
    fill: "none" as const,
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (kind === "fifty") {
    return (
      <svg viewBox="0 0 40 40" className="size-6 sm:size-8" aria-hidden>
        <path d="M6 20l5 5 10-12" {...common} />
        <path d="M18 22l5 5 11-14" {...common} />
      </svg>
    );
  }

  if (kind === "phone") {
    return (
      <svg viewBox="0 0 40 40" className="size-6 sm:size-8" aria-hidden>
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
    return (
      <svg viewBox="0 0 40 40" className="size-6 sm:size-8" aria-hidden>
        <path
          d="M14 14c0-4 3.2-7 6.8-7S28 10 28 14c0 3.2-2 4.6-4.4 6.2-1.6 1-2.6 2-2.6 4.2"
          {...common}
          strokeWidth="2.4"
        />
        <circle cx="21" cy="30" r="1.8" fill={color} stroke="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" className="size-6 sm:size-8" aria-hidden>
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
