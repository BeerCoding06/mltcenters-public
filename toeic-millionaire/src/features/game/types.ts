export type QuestionCategory =
  | "VOCABULARY"
  | "GRAMMAR"
  | "READING"
  | "LISTENING"
  | "BUSINESS_ENGLISH"
  | "RANDOM";

export type TileType =
  | "START"
  | "VOCABULARY"
  | "GRAMMAR"
  | "READING"
  | "LISTENING"
  | "BUSINESS_EMAIL"
  | "BUSINESS_MEETING"
  | "AIRPORT"
  | "HOTEL"
  | "COMPANY"
  | "PROMOTION"
  | "SALARY"
  | "LIBRARY"
  | "ENGLISH_CAMP"
  | "EXAM_CENTER"
  | "LUCKY_CARD"
  | "EVENT_CARD"
  | "BONUS"
  | "TAX"
  | "REST"
  | "MINI_GAME"
  | "BOSS_QUIZ"
  | "CHALLENGE"
  | "RANDOM_QUESTION"
  | "GOLD_CHEST"
  | "DIAMOND_CHEST"
  | "TREASURE";

export interface TileDefinition {
  id: number;
  type: TileType;
  label: string;
  labelTh: string;
  category?: QuestionCategory;
  quizWeight?: number;
}

export type TileAction =
  | { type: "start" }
  | { type: "quiz"; category: QuestionCategory; hard?: boolean }
  | { type: "drawCard"; deck: "LUCKY" | "EVENT" }
  | { type: "bonus"; coins: number; exp?: number }
  | { type: "tax"; coins: number }
  | { type: "rest" }
  | { type: "freeHint" }
  | { type: "miniGame" }
  | { type: "challenge" }
  | { type: "chest"; tier: "gold" | "diamond" | "treasure" }
  | { type: "flavor"; effect: "quiz" | "bonus" };

export interface PlayerState {
  id: string;
  lap: number;
  coins: number;
  turns: number;
}

export interface WinRules {
  lapsToWin: number;
  maxTurnsPerPlayer: number;
}

export interface AdvanceResult {
  position: number;
  lap: number;
  passedStart: boolean;
}
