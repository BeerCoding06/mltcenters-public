"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ensureGuestId } from "@/features/auth/guest-id";
import { useGameLang } from "@/features/i18n/GameLangProvider";

export default function LandingPage() {
  const { t, isTh } = useGameLang();

  useEffect(() => {
    ensureGuestId();
  }, []);

  const headline = isTh ? (
    <>
      ทอยลูกเต๋า. เรียนรู้.{" "}
      <span className="bg-gradient-to-r from-[var(--millionaire-gold)] to-[var(--millionaire-cyan)] bg-clip-text text-transparent">
        ชนะ.
      </span>
    </>
  ) : (
    <>
      Roll. Learn.{" "}
      <span className="bg-gradient-to-r from-[var(--millionaire-gold)] to-[var(--millionaire-cyan)] bg-clip-text text-transparent">
        Win.
      </span>
    </>
  );

  return (
    <div className="dark millionaire-studio-bg relative flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-4 pr-24">
        <span className="text-lg font-bold tracking-tight text-[var(--millionaire-gold)]">
          {t.brand}
        </span>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 pb-16 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {headline}
          </h1>
          <p className="mx-auto max-w-lg text-[var(--millionaire-silver)]">
            {t.landingSub}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/play"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full border-2 border-[var(--millionaire-gold)] bg-[var(--millionaire-gold)] text-black hover:bg-[var(--millionaire-gold)]/90",
            )}
          >
            {t.playNow}
          </Link>
          <Link
            href="/play"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className:
                "rounded-full border-[var(--millionaire-silver)] text-white hover:bg-black/50",
            })}
          >
            {t.enterLobby}
          </Link>
        </div>

        <p className="text-xs text-[var(--millionaire-silver)]">
          {t.landingGuestNote}
        </p>
      </main>
    </div>
  );
}
