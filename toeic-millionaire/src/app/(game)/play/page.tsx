"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ensureGuestId } from "@/features/auth/guest-id";
import { saveHotseatSession } from "@/features/hotseat/session";
import { useGameLang } from "@/features/i18n/GameLangProvider";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

export default function PlayLobbyPage() {
  const router = useRouter();
  const { t } = useGameLang();

  const [displayName, setName] = useState("Player");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [loading, setLoading] = useState(false);

  function handleStart() {
    setLoading(true);
    ensureGuestId();
    saveHotseatSession({
      displayName: displayName.trim() || "Player",
      difficulty,
      createdAt: Date.now(),
    });
    router.push("/hotseat");
  }

  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.gameLobby}</h1>
          <p className="text-sm text-[var(--millionaire-silver)]">
            {t.gameLobbySub}
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--millionaire-silver)]/50 bg-black p-5 shadow-[0_0_24px_rgb(91_192_255_/_8%)]">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-white">{t.displayName}</span>
            <input
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-full border border-[var(--millionaire-silver)]/50 bg-black px-4 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--millionaire-cyan)]/50"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-white">{t.difficulty}</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-full border border-[var(--millionaire-silver)]/50 bg-black px-4 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--millionaire-cyan)]/50"
            >
              <option value="EASY">{t.easy}</option>
              <option value="MEDIUM">{t.medium}</option>
              <option value="HARD">{t.hard}</option>
            </select>
          </label>
        </div>

        <Button
          size="lg"
          disabled={loading}
          onClick={handleStart}
          className="w-full rounded-full border-2 border-[var(--millionaire-gold)] bg-[var(--millionaire-gold)] text-black hover:bg-[var(--millionaire-gold)]/90"
        >
          {loading ? t.starting : t.startGame}
        </Button>
      </main>
    </div>
  );
}
