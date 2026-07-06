import type { GameState, PerformanceEvaluation } from "../types";

const API =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api/v1" : "/runner-api");

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const gameApi = {
  newGame: () => post<{ session_id: string; game_state: GameState }>("/game/new"),
  generateQuestion: (session_id: string) =>
    post<{ session_id: string; game_state: GameState }>("/generate-question", { session_id }),
  checkAnswer: (session_id: string, question_id: string, selected_index: number) =>
    post<{ correct: boolean; game_state: GameState; animation: string }>("/check-answer", {
      session_id,
      question_id,
      selected_index,
    }),
  evaluate: (session_id: string) =>
    post<{ session_id: string; stats: Record<string, number>; evaluation: PerformanceEvaluation }>(
      "/evaluate-performance",
      { session_id }
    ),
  reset: (session_id: string) => post<GameState>(`/game/reset/${session_id}`),
};

/** Set VITE_RPM_AVATAR_URL only if you host a .glb yourself (optional). */
export const RPM_AVATAR_URL = import.meta.env.VITE_RPM_AVATAR_URL || "";
