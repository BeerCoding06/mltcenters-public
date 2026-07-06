import type { GameState } from "../types";

const API = "/api/v1";

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

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export const gameApi = {
  newGame: () => post<{ session_id: string; game_state: GameState }>("/game/new"),
  generateQuestion: (session_id: string) =>
    post<{ session_id: string; game_state: GameState }>("/generate-question", { session_id }),
  checkAnswer: (session_id: string, question_id: string, selected_index: number) =>
    post<{ correct: boolean; game_state: GameState }>("/check-answer", {
      session_id,
      question_id,
      selected_index,
    }),
  getState: (session_id: string) => get<GameState>(`/game-state/${session_id}`),
  reset: (session_id: string) => post<GameState>(`/game/reset/${session_id}`),
};
