"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    <div className="flex min-h-full flex-col bg-gradient-to-b from-[#1E293B]/20 to-background">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Home
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-bold">Game Lobby</h1>
          <p className="text-sm text-muted-foreground">
            Configure your solo match against AI bots.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-xl">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Display name</span>
            <input
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Bot opponents ({botCount})</span>
            <input
              type="range"
              min={1}
              max={3}
              value={botCount}
              onChange={(e) => setBotCount(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>2</span>
              <span>3</span>
            </div>
          </label>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          size="lg"
          disabled={loading}
          onClick={() => void handleStart()}
          className="w-full bg-emerald-500 text-white hover:bg-emerald-400"
        >
          {loading ? "Starting…" : "Start Game"}
        </Button>
      </main>
    </div>
  );
}
