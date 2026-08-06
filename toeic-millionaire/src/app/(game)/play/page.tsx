"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ensureGuestId } from "@/features/auth/guest-id";
import { useGameStore } from "@/features/game/useGameStore";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

export default function PlayLobbyPage() {
  const router = useRouter();
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
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          displayName: displayName.trim() || "Player",
          difficulty,
          botCount,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Failed to start game");
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
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-sm text-[var(--millionaire-silver)] hover:text-[var(--millionaire-cyan)]"
        >
          ← Home
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Game Lobby</h1>
          <p className="text-sm text-[var(--millionaire-silver)]">
            Configure your solo match against AI bots.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--millionaire-silver)]/50 bg-black p-5 shadow-[0_0_24px_rgb(91_192_255_/_8%)]">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-white">Display name</span>
            <input
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-full border border-[var(--millionaire-silver)]/50 bg-black px-4 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--millionaire-cyan)]/50"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-white">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-full border border-[var(--millionaire-silver)]/50 bg-black px-4 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--millionaire-cyan)]/50"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-white">
              Bot opponents ({botCount})
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
          {loading ? "Starting…" : "Start Game"}
        </Button>
      </main>
    </div>
  );
}
