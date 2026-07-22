export type VocabGoal = 'general' | 'toeic' | 'travel' | 'business';
export type QuizType = 'mcq' | 'type' | 'fill';
export type VocabSessionMode = 'learn' | 'review' | 'quiz';

export interface VocabDashboard {
  profileId: string;
  goal: VocabGoal;
  levelId: string;
  xp: number;
  streakDays: number;
  wordsLearned: number;
  accuracy7d: number;
  weakWords: Array<{ id: string; word: string; meaning_th: string; memoryScore: number }>;
  strongWords: Array<{ id: string; word: string; meaning_th: string; memoryScore: number }>;
  today: {
    learnRemaining: number;
    reviewDue: number;
    sentencesReady: boolean;
  };
  coachTip: string;
}

export interface VocabSessionPrompt {
  word: string | null;
  ipa: string | null;
  meaning_th: string | null;
  example_en?: string;
  example_th?: string;
}

export interface VocabSessionItem {
  wordId: string;
  quizType: QuizType;
  expected: string;
  promptMode: string;
  prompt: VocabSessionPrompt;
  options?: string[];
}

export interface VocabSessionStart {
  sessionId: string;
  items: VocabSessionItem[];
}

export interface VocabAnswerPayload {
  wordId: string;
  quizType: QuizType;
  userAnswer: string;
  responseMs: number;
  confidence: number;
}

export interface VocabAnswerResult {
  memoryScore: number;
  nextReviewAt: number;
  xpDelta: number;
  masteryLevel: number;
  isCorrect: boolean;
}

export interface VocabWordStat {
  memoryScore: number;
  masteryLevel: number;
  status: string;
  correctCount: number;
  wrongCount: number;
  nextReviewAt: number | null;
}

export interface VocabWordDetail {
  id: string;
  word: string;
  ipa: string;
  pos: string;
  meaning_th: string;
  example_en: string;
  example_th: string;
  difficulty: number;
  category: string;
  stat: VocabWordStat | null;
}

export interface VocabSentence {
  en: string;
  th: string;
  wordIds: string[];
}

export interface VocabSentencesResponse {
  sentences: VocabSentence[];
  cached: boolean;
}
