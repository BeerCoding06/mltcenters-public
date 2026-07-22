export type VocabGoal = 'general' | 'toeic' | 'travel' | 'business';
export type QuizType = 'mcq' | 'type' | 'fill';

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
