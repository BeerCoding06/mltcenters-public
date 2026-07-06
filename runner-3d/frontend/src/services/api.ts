import type { GameState, PerformanceEvaluation } from "../types";

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

/** Ready Player Me demo avatar — replace with your own .glb URL */
export const RPM_AVATAR_URL =
  import.meta.env.VITE_RPM_AVATAR_URL ||
  "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb";

export const ANIM_PATHS = {
  run: import.meta.env.VITE_ANIM_RUN || "/models/animations/run.glb",
  idle: import.meta.env.VITE_ANIM_IDLE || "/models/animations/idle.glb",
  jump: import.meta.env.VITE_ANIM_JUMP || "/models/animations/jump.glb",
  win: import.meta.env.VITE_ANIM_WIN || "/models/animations/win.glb",
  lose: import.meta.env.VITE_ANIM_LOSE || "/models/animations/lose.glb",
};
