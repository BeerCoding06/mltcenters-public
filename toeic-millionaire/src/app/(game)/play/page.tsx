"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ensureGuestId } from "@/features/auth/guest-id";
import { useGameStore } from "@/features/game/useGameStore";
import { useGameLang } from "@/features/i18n/GameLangProvider";
import { apiUrl } from "@/lib/api-url";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

export default function PlayLobbyPage() {
  const router = useRouter();
  const { t } = useGameLang();
  const setDisplayName = useGameStore((s) => s.setDisplayName);
  const setHumanPlayerId = useGameStore((s) => s.setHumanPlayerId);

  const [displayName, setName] = useState("Player");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [botCount, setBotCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);

    try {
      const guestId = ensureGuestId();
      const res = await fetch(apiUrl("/api/game/start"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          displayName: displayName.trim() || "Player",
          difficulty,
          botCount,
        }),
        signal: AbortSignal.timeout(12_000),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        const msg = payload?.error ?? t.failedStart;
        throw new Error(
          /database|DATABASE_URL|ECONNREFUSED|timeout/i.test(msg)
            ? t.dbHint
            : msg,
        );
      }

      const data = (await res.json()) as {
        sessionId: string;
        state: { players: { id: string; isBot: boolean }[] };
      };

      const human = data.state.players.find((p) => !p.isBot);
      if (human) {
        setHumanPlayerId(human.id);
      }
      setDisplayName(displayName.trim() || "Player");
      router.push(`/board/${data.sessionId}`);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.name === "TimeoutError" || err.name === "AbortError")
      ) {
        setError(t.startTimeout);
      } else {
        setError(err instanceof Error ? err.message : t.failedStart);
      }
    } finally {
      setLoading(false);
    }
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

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-white">
              {t.botOpponents} ({botCount})
            </span>
            <input
              type="range"
              min={1}
              max={3}
              value={botCount}
              onChange={(e) => setBotCount(Number(e.target.value))}
              className="w-full accent-[var(--millionaire-gold)]"
            />
            <div className="flex justify-between text-xs text-[var(--millionaire-silver)]">
              <span>1</span>
              <span>2</span>
              <span>3</span>
            </div>
          </label>
        </div>

        {error ? (
          <p className="text-sm text-[var(--millionaire-wrong)]">{error}</p>
        ) : null}

        <Button
          size="lg"
          disabled={loading}
          onClick={() => void handleStart()}
          className="w-full rounded-full border-2 border-[var(--millionaire-gold)] bg-[var(--millionaire-gold)] text-black hover:bg-[var(--millionaire-gold)]/90"
        >
          {loading ? t.starting : t.startGame}
        </Button>
      </main>
    </div>
  );
}
