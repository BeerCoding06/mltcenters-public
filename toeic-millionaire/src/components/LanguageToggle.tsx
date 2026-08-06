"use client";

import { Languages } from "lucide-react";
import { useGameLang } from "@/features/i18n/GameLangProvider";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
  /** Compact lifeline circle (quiz/card) vs header pill */
  variant?: "lifeline" | "header";
}

export function LanguageToggle({
  className,
  variant = "header",
}: LanguageToggleProps) {
  const { lang, toggleLang, t, isTh } = useGameLang();

  const title = isTh ? t.showEnglish : t.translateTh;

  if (variant === "lifeline") {
    return (
      <button
        type="button"
        title={title}
        aria-label={title}
        onClick={toggleLang}
        className={cn(
          "millionaire-lifeline",
          isTh && "millionaire-lifeline-active",
          className,
        )}
        aria-pressed={isTh}
      >
        <Languages className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={toggleLang}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[var(--millionaire-silver)]/50 bg-black/80 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm transition hover:border-[var(--millionaire-cyan)] hover:text-[var(--millionaire-cyan)]",
        isTh &&
          "border-[var(--millionaire-gold)] text-[var(--millionaire-gold)]",
        className,
      )}
      aria-pressed={isTh}
    >
      <Languages className="size-3.5" />
      <span className="tabular-nums">{lang === "th" ? "TH" : "EN"}</span>
    </button>
  );
}

/** Always-visible language icon (every screen). */
export function LanguageToggleFixed() {
  return (
    <div className="pointer-events-none fixed top-3 right-3 z-[100] sm:top-4 sm:right-4">
      <div className="pointer-events-auto">
        <LanguageToggle />
      </div>
    </div>
  );
}
