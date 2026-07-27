"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { GameStateSnapshot } from "./game-service";

async function fetchGameState(sessionId: string): Promise<GameStateSnapshot> {
  const res = await fetch(`/api/game/${sessionId}/state`);
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to load game state");
  }
  return res.json() as Promise<GameStateSnapshot>;
}

export function gameSessionQueryKey(sessionId: string) {
  return ["game", sessionId] as const;
}

export function useGameSession(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: gameSessionQueryKey(sessionId),
    queryFn: () => fetchGameState(sessionId),
    enabled: Boolean(sessionId) && enabled,
    refetchInterval: (query) =>
      query.state.data?.status === "ACTIVE" ? 4000 : false,
  });
}

export function useInvalidateGameSession() {
  const queryClient = useQueryClient();
  return (sessionId: string) =>
    queryClient.invalidateQueries({ queryKey: gameSessionQueryKey(sessionId) });
}
