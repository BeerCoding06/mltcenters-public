export interface Scores {
  grammar: number;
  vocabulary: number;
  fluency: number;
  coherence: number;
}

export interface AIAssessmentResponse {
  reply: string;
  scores: Scores | null;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | null;
}

export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  scores?: Scores;
  level?: string;
}

export interface AssessmentResult {
  scores: Scores;
  level: string;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
  totalXP: number;
  badges: string[];
}

export const LEVEL_THRESHOLDS = { Beginner: [0, 59], Intermediate: [60, 79], Advanced: [80, 100] } as const;
