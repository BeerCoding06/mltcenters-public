"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ensureGuestId } from "@/features/auth/guest-id";

export default function LandingPage() {
  useEffect(() => {
    ensureGuestId();
  }, []);

  return (
    <div className="relative flex min-h-full flex-col bg-gradient-to-b from-[#1E293B] via-background to-background">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold tracking-tight text-amber-400">
          TOEIC Millionaire
        </span>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 pb-16 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Roll. Learn.{" "}
            <span className="bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">
              Win.
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Monopoly-style board game meets TOEIC practice. Answer quizzes,
            draw lucky cards, and race bots to the finish.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/play"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-amber-400 text-[#1E293B] hover:bg-amber-300",
            )}
          >
            Play as Guest
          </Link>
          <Link href="/play" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Start Game
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          No account needed · Progress saved locally as guest
        </p>
      </main>
    </div>
  );
}
