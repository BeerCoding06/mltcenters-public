export type {
  AnimState,
  GamePhase,
  Obstacle,
  ObstacleKind,
  VisualFx,
  AnswerFeedback,
  GameSnapshot,
  Question,
} from "../game/types";

export interface GameState {
  session_id: string;
  score: number;
  hp: number;
  speed: number;
  streak: number;
  questions_answered: number;
  correct_count: number;
  difficulty: string;
  current_question: import("../game/types").Question | null;
  last_explanation: string;
  last_correct: boolean | null;
  game_over: boolean;
  distance: number;
}

export interface PerformanceEvaluation {
  overall: number;
  vocabulary: number;
  grammar: number;
  reaction: number;
  level: string;
  strengths: string[];
  improvements: string[];
  summary: string;
}
