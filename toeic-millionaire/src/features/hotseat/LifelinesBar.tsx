"use client";

import { cn } from "@/lib/utils";

export type LifelineKind = "fifty" | "phone" | "swap";

type LifelineItem = {
  kind: LifelineKind;
  label: string;
  desc: string;
  icon: string;
  used: boolean;
  disabled: boolean;
  loading?: boolean;
  onClick: () => void;
};

type Props = {
  title: string;
  items: LifelineItem[];
};

export function LifelinesBar({ title, items }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--millionaire-gold)]/40 bg-black/70 p-3 shadow-[0_0_24px_rgb(251_191_36_/_12%)]">
      <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.18em] text-[var(--millionaire-gold)]">
        {title}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.kind}
            type="button"
            disabled={item.disabled || item.loading}
            onClick={item.onClick}
            className={cn(
              "relative flex min-h-[5rem] flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-3 text-center transition",
              "border-[var(--millionaire-gold)] bg-[#0a1628] text-[var(--millionaire-gold)]",
              "hover:enabled:bg-[var(--millionaire-gold)]/10 hover:enabled:shadow-[0_0_16px_rgb(251_191_36_/_35%)]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              item.used &&
                "border-[var(--millionaire-silver)]/40 text-[var(--millionaire-silver)]",
            )}
            aria-label={item.label}
          >
            <span className="text-xl font-black leading-none" aria-hidden>
              {item.loading ? "…" : item.icon}
            </span>
            <span className="text-xs font-bold leading-tight sm:text-sm">
              {item.label}
            </span>
            <span className="text-[10px] leading-snug text-[var(--millionaire-silver)] sm:text-[11px]">
              {item.desc}
            </span>
            {item.used ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-3xl text-[var(--millionaire-wrong)]">
                ✕
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
