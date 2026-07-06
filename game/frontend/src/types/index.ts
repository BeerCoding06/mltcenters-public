export interface Question {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
}

export interface GameState {
  session_id: string;
  score: number;
  hp: number;
  speed: number;
  streak: number;
  questions_answered: number;
  correct_count: number;
  difficulty: string;
  current_question: Question | null;
  last_explanation: string;
  game_over: boolean;
}

export type GamePhase = "loading" | "running" | "question" | "feedback" | "gameover";
