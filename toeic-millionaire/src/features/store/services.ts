/**
 * In-memory game runtime (no Postgres). Shared across API routes in one Node process.
 */
import {
  createMemoryCardService,
  createMemoryGameService,
  createMemoryHintService,
  createMemoryQuizService,
  createMemoryTranslateService,
  getQuestionBankStats,
} from "@/features/store/memory-runtime";

export const memoryGame = createMemoryGameService();
export const memoryQuiz = createMemoryQuizService();
export const memoryCards = createMemoryCardService();
export const memoryHints = createMemoryHintService();
export const memoryTranslate = createMemoryTranslateService();
export { getQuestionBankStats };
