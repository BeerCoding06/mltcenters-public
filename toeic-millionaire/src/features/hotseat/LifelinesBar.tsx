"use client";

import { cn } from "@/lib/utils";

export type LifelineKind = "fifty" | "audience" | "phone" | "hint";

type LifelineItem = {
  kind: LifelineKind;
  label: string;
  desc: string;
  icon: string;
  used: boolean;
  disabled: boolean;
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.kind}
            type="button"
            disabled={item.disabled}
            onClick={item.onClick}
            className={cn(
              "relative flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-2 py-2 text-center transition",
              "border-[var(--millionaire-gold)] bg-[#0a1628] text-[var(--millionaire-gold)]",
              "hover:enabled:bg-[var(--millionaire-gold)]/10 hover:enabled:shadow-[0_0_16px_rgb(251_191_36_/_35%)]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              item.used && "border-[var(--millionaire-silver)]/40 text-[var(--millionaire-silver)] line-through",
            )}
            aria-label={item.label}
          >
            <span className="text-lg font-black leading-none" aria-hidden>
              {item.icon}
            </span>
            <span className="text-[11px] font-bold leading-tight sm:text-xs">
              {item.label}
            </span>
            <span className="hidden text-[10px] leading-tight text-[var(--millionaire-silver)] sm:block">
              {item.desc}
            </span>
            {item.used ? (
              <span className="absolute inset-0 flex items-center justify-center text-2xl text-[var(--millionaire-wrong)]">
                ✕
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
