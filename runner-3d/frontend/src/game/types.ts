import type { GameState, PerformanceEvaluation } from "../types";

export type AnimState =
  | "idle"
  | "countdown"
  | "run"
  | "jump_start"
  | "jump"
  | "jump_land"
  | "hit"
  | "recover"
  | "celebrate"
  | "gameover";

export type ObstacleKind =
  | "rock"
  | "woodBox"
  | "fence"
  | "hole"
  | "tree"
  | "barrier";

export interface Obstacle {
  id: number;
  z: number;
  kind: ObstacleKind;
  cleared: boolean;
}

export type GamePhase = "loading" | "countdown" | "running" | "gameover";

export interface VisualFx {
  flash: "green" | "red" | null;
  shake: number;
  slowMo: number;
  speedLines: boolean;
  landingBurst: boolean;
}

export interface AnswerFeedback {
  selectedIndex: number;
  correct: boolean;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
}

export interface GameSnapshot {
  phase: GamePhase;
  state: GameState | null;
  animState: AnimState;
  scrollZ: number;
  obstacles: Obstacle[];
  jumpHeight: number;
  activeObstacleId: number | null;
  evaluation: PerformanceEvaluation | null;
  submitting: boolean;
  fx: VisualFx;
  answerFeedback: AnswerFeedback | null;
  combo: number;
}

export type { GameState, PerformanceEvaluation };
