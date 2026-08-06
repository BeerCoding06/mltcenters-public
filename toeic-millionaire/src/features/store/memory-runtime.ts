import { randomUUID } from "crypto";
import questionsBank from "@/data/toeic-questions.json";
import cardsBank from "@/data/cards.json";
import type { CardEffect, EffectPlayer, EffectResult } from "@/features/cards/effects";
import { applyCardEffect, mergePatch } from "@/features/cards/effects";
import type { CardDto } from "@/features/cards/card-service";
import { CardError } from "@/features/cards/card-service";
import {
  advancePosition,
  checkWin,
  loadTiles,
  resolveTile,
  rollDice,
} from "@/features/game/fsm";
import type { TileAction } from "@/features/game/types";
import {
  GameError,
  type EndGameInput,
  type GameStateSnapshot,
  type StartGameInput,
} from "@/features/game/game-service";
import {
  adjustDifficulty,
  computeQuizRewards,
  gradeChoice,
  nextStreakAfterAnswer,
} from "@/features/quiz/grade";
import {
  QuizError,
  type NextQuestionDto,
  type NextQuestionInput,
  type SubmitAnswerDto,
  type SubmitAnswerInput,
} from "@/features/quiz/quiz-service";
import type { TranslationResult } from "@/features/quiz/translate-service";
import { TranslateError } from "@/features/quiz/translate-service";
import { HintError, HINT_COST } from "@/features/quiz/hint-service";

export type MemoryDifficulty = "EASY" | "MEDIUM" | "HARD";
export type MemoryCategory =
  | "VOCABULARY"
  | "GRAMMAR"
  | "READING"
  | "LISTENING"
  | "BUSINESS_ENGLISH"
  | "RANDOM";

export interface MemoryChoice {
  id: string;
  label: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface MemoryQuestion {
  id: string;
  category: Exclude<MemoryCategory, "RANDOM">;
  type: string;
  difficulty: MemoryDifficulty;
  stem: string;
  passage: string | null;
  audioUrl: string | null;
  explanation: string;
  explanationTh: string | null;
  hint: string | null;
  hintTh: string | null;
  stemTh: string | null;
  choices: MemoryChoice[];
}

interface MemoryPlayer {
  id: string;
  displayName: string;
  isBot: boolean;
  position: number;
  lap: number;
  coins: number;
  exp: number;
  skipNext: boolean;
  sortOrder: number;
  turns: number;
}

interface MemorySession {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  difficulty: MemoryDifficulty;
  turnCount: number;
  maxTurns: number;
  lapsToWin: number;
  currentIndex: number;
  winnerId: string | null;
  players: MemoryPlayer[];
  attemptedQuestionIds: string[];
  attemptHistory: { playerId: string; isCorrect: boolean }[];
}

interface MemoryCardDef {
  id: string;
  deck: "LUCKY" | "EVENT";
  title: string;
  body: string;
  effect: CardEffect;
  weight: number;
}

const QUESTIONS = questionsBank as MemoryQuestion[];
const CARDS = (cardsBank as Array<{
  id: string;
  deck: "LUCKY" | "EVENT";
  title: string;
  body: string;
  effect: CardEffect;
  weight?: number;
}>).map((c) => ({ ...c, weight: c.weight ?? 1 })) as MemoryCardDef[];

const sessions = new Map<string, MemorySession>();

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

function pickWeighted<T extends { weight: number }>(cards: T[]): T {
  const total = cards.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * total;
  for (const card of cards) {
    roll -= card.weight;
    if (roll <= 0) return card;
  }
  return cards[cards.length - 1];
}

function mapQuizType(type: string): string {
  if (type === "SENTENCE_COMPLETION") return "sentence_completion";
  if (type === "ERROR_IDENTIFICATION") return "error_identification";
  return "mcq";
}

function applyTileEffects(
  tileAction: TileAction,
  coins: number,
  exp: number,
): { coins: number; exp: number; skipNext: boolean } {
  let nextCoins = coins;
  let nextExp = exp;
  let skipNext = false;
  switch (tileAction.type) {
    case "bonus":
      nextCoins += tileAction.coins;
      nextExp += tileAction.exp ?? 0;
      break;
    case "tax":
      nextCoins = Math.max(0, nextCoins - tileAction.coins);
      break;
    case "rest":
      skipNext = true;
      break;
    default:
      break;
  }
  return { coins: nextCoins, exp: nextExp, skipNext };
}

function snapshot(session: MemorySession): GameStateSnapshot {
  const current = session.players[session.currentIndex];
  const winnerId =
    session.winnerId ??
    (session.status === "COMPLETED"
      ? checkWin(
          session.players.map((p) => ({
            id: p.id,
            lap: p.lap,
            coins: p.coins,
            turns: p.turns,
          })),
          { lapsToWin: session.lapsToWin, maxTurnsPerPlayer: session.maxTurns },
        )
      : null);

  return {
    sessionId: session.id,
    status: session.status,
    difficulty: session.difficulty,
    turnCount: session.turnCount,
    maxTurns: session.maxTurns,
    lapsToWin: session.lapsToWin,
    currentIndex: session.currentIndex,
    currentPlayerId: current?.id ?? "",
    winnerId,
    players: session.players.map((p) => ({ ...p })),
  };
}

function requireSession(sessionId: string): MemorySession {
  const session = sessions.get(sessionId);
  if (!session) throw new GameError("Session not found", "NOT_FOUND");
  return session;
}

function requireQuizSession(sessionId: string): MemorySession {
  const session = sessions.get(sessionId);
  if (!session) throw new QuizError("Session not found", "NOT_FOUND");
  return session;
}

function requireCardSession(sessionId: string): MemorySession {
  const session = sessions.get(sessionId);
  if (!session) throw new CardError("Session not found", "NOT_FOUND");
  return session;
}

function requireHintSession(sessionId: string): MemorySession {
  const session = sessions.get(sessionId);
  if (!session) throw new HintError("Session not found", "NOT_FOUND");
  return session;
}

export function getQuestionBankStats() {
  const byCategory: Record<string, number> = {};
  for (const q of QUESTIONS) {
    byCategory[q.category] = (byCategory[q.category] ?? 0) + 1;
  }
  return {
    questions: QUESTIONS.length,
    cards: CARDS.length,
    byCategory,
  };
}

export function getQuestionById(id: string): MemoryQuestion | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

/** File-backed TOEIC game — no database required. */
export function createMemoryGameService() {
  return {
    async startGame(input: StartGameInput): Promise<{ sessionId: string; state: GameStateSnapshot }> {
      const id = randomUUID();
      const human: MemoryPlayer = {
        id: randomUUID(),
        displayName: input.displayName,
        isBot: false,
        position: 0,
        lap: 0,
        coins: 1500,
        exp: 0,
        skipNext: false,
        sortOrder: 0,
        turns: 0,
      };
      const bots: MemoryPlayer[] = Array.from({ length: input.botCount }, (_, i) => ({
        id: randomUUID(),
        displayName: `Bot ${i + 1}`,
        isBot: true,
        position: 0,
        lap: 0,
        coins: 1500,
        exp: 0,
        skipNext: false,
        sortOrder: i + 1,
        turns: 0,
      }));

      const session: MemorySession = {
        id,
        status: "ACTIVE",
        difficulty: input.difficulty,
        turnCount: 0,
        maxTurns: 30,
        lapsToWin: 2,
        currentIndex: 0,
        winnerId: null,
        players: [human, ...bots],
        attemptedQuestionIds: [],
        attemptHistory: [],
      };
      sessions.set(id, session);
      return { sessionId: id, state: snapshot(session) };
    },

    async getState(sessionId: string): Promise<GameStateSnapshot> {
      return snapshot(requireSession(sessionId));
    },

    async roll(sessionId: string, playerId?: string) {
      const session = requireSession(sessionId);
      if (session.status !== "ACTIVE") {
        throw new GameError(
          "Game is not active",
          session.status === "COMPLETED" ? "ALREADY_ENDED" : "NOT_ACTIVE",
        );
      }

      const currentPlayer = session.players[session.currentIndex];
      if (!currentPlayer) throw new GameError("No current player", "NOT_FOUND");
      if (playerId && playerId !== currentPlayer.id) {
        throw new GameError("Not your turn", "NOT_YOUR_TURN");
      }
      if (currentPlayer.isBot && !playerId) {
        throw new GameError("Bot turn requires playerId", "NOT_YOUR_TURN");
      }

      const tiles = loadTiles();
      const nextIndex = (session.currentIndex + 1) % session.players.length;

      if (currentPlayer.skipNext) {
        currentPlayer.skipNext = false;
        session.currentIndex = nextIndex;
        session.turnCount += 1;
        return {
          dice: 0,
          skipped: true,
          tileAction: { type: "rest" as const },
          newState: snapshot(session),
        };
      }

      const dice = rollDice();
      const advance = advancePosition(
        currentPlayer.position,
        dice,
        currentPlayer.lap,
      );
      const tile = tiles[advance.position];
      const tileAction = resolveTile(tile);

      let coins = currentPlayer.coins;
      let exp = currentPlayer.exp;
      if (advance.passedStart) coins += 200;
      const effects = applyTileEffects(tileAction, coins, exp);

      currentPlayer.position = advance.position;
      currentPlayer.lap = advance.lap;
      currentPlayer.coins = effects.coins;
      currentPlayer.exp = effects.exp;
      currentPlayer.skipNext = effects.skipNext;
      currentPlayer.turns += 1;
      session.currentIndex = nextIndex;
      session.turnCount += 1;

      const state = snapshot(session);
      const winnerId = checkWin(
        state.players.map((p) => ({
          id: p.id,
          lap: p.lap,
          coins: p.coins,
          turns: p.turns,
        })),
        { lapsToWin: session.lapsToWin, maxTurnsPerPlayer: session.maxTurns },
      );

      if (winnerId) {
        session.status = "COMPLETED";
        session.winnerId = winnerId;
        return {
          dice,
          skipped: false,
          tileAction,
          newState: { ...snapshot(session), winnerId },
        };
      }

      return { dice, skipped: false, tileAction, newState: state };
    },

    async endGame(sessionId: string, input: EndGameInput = {}): Promise<GameStateSnapshot> {
      const session = requireSession(sessionId);
      if (session.status !== "ACTIVE") {
        throw new GameError("Game already ended", "ALREADY_ENDED");
      }
      session.status = input.reason === "abandoned" ? "ABANDONED" : "COMPLETED";
      return snapshot(session);
    },
  };
}

export function createMemoryQuizService() {
  return {
    async getNextQuestion(input: NextQuestionInput): Promise<NextQuestionDto> {
      const session = requireQuizSession(input.sessionId);
      if (session.status !== "ACTIVE") {
        throw new QuizError("Session is not active", "NOT_ACTIVE");
      }

      const categoryFilter =
        input.category === "RANDOM"
          ? null
          : (input.category as MemoryQuestion["category"]);

      let candidates = QUESTIONS.filter(
        (q) =>
          q.difficulty === input.difficulty &&
          !session.attemptedQuestionIds.includes(q.id) &&
          (categoryFilter ? q.category === categoryFilter : true),
      );

      if (candidates.length === 0) {
        candidates = QUESTIONS.filter(
          (q) =>
            !session.attemptedQuestionIds.includes(q.id) &&
            (categoryFilter ? q.category === categoryFilter : true),
        );
      }
      if (candidates.length === 0) {
        candidates = QUESTIONS.filter((q) =>
          categoryFilter ? q.category === categoryFilter : true,
        );
      }

      const question = pickRandom(candidates);
      if (!question) throw new QuizError("No questions available", "NO_QUESTIONS");

      return {
        questionId: question.id,
        stem: question.stem,
        passage: question.passage,
        audioUrl: question.audioUrl,
        quizType: mapQuizType(question.type),
        choices: question.choices.map((c) => ({ id: c.id, label: c.label })),
      };
    },

    async submitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerDto> {
      const session = requireQuizSession(input.sessionId);
      if (session.status !== "ACTIVE") {
        throw new QuizError("Session is not active", "NOT_ACTIVE");
      }
      const player = session.players.find((p) => p.id === input.playerId);
      if (!player) throw new QuizError("Player not found", "NOT_FOUND");

      const question = getQuestionById(input.questionId);
      if (!question) throw new QuizError("Question not found", "NOT_FOUND");
      if (!question.choices.some((c) => c.id === input.choiceId)) {
        throw new QuizError("Invalid choice", "INVALID_CHOICE");
      }

      const isCorrect = gradeChoice(question.choices, input.choiceId);
      const rewards = computeQuizRewards(
        isCorrect,
        input.isBoss ?? false,
        player.coins,
      );

      const recent = session.attemptHistory
        .filter((a) => a.playerId === input.playerId)
        .slice(-5)
        .reverse();
      const streak = nextStreakAfterAnswer(recent, isCorrect);
      session.difficulty = adjustDifficulty(session.difficulty, [
        { isCorrect },
        ...recent,
      ]) as MemoryDifficulty;

      player.coins = Math.max(0, player.coins + rewards.coinsDelta);
      player.exp += rewards.expDelta;
      if (rewards.skipNext) player.skipNext = true;

      session.attemptedQuestionIds.push(question.id);
      session.attemptHistory.push({ playerId: input.playerId, isCorrect });

      return {
        isCorrect,
        coinsDelta: rewards.coinsDelta,
        expDelta: rewards.expDelta,
        explanation: question.explanation,
        explanationTh:
          question.explanationTh ??
          (isCorrect
            ? `ถูกต้อง — ${question.explanation}`
            : `ยังไม่ถูก — ${question.explanation}`),
        streak,
      };
    },
  };
}

export function createMemoryCardService() {
  return {
    async drawCard(input: {
      sessionId: string;
      playerId: string;
      deck: "LUCKY" | "EVENT";
    }) {
      const session = requireCardSession(input.sessionId);
      if (session.status !== "ACTIVE") {
        throw new CardError("Game is not active", "NOT_ACTIVE");
      }
      const player = session.players.find((p) => p.id === input.playerId);
      if (!player) throw new CardError("Player not found", "NOT_FOUND");

      const deckCards = CARDS.filter((c) => c.deck === input.deck);
      if (deckCards.length === 0) throw new CardError("No cards in deck", "NO_CARDS");

      const picked = pickWeighted(deckCards);
      const effectPlayer: EffectPlayer = {
        id: player.id,
        position: player.position,
        lap: player.lap,
        coins: player.coins,
        exp: player.exp,
        skipNext: player.skipNext,
      };
      const effectResult: EffectResult = applyCardEffect({}, effectPlayer, picked.effect);
      const next = mergePatch(effectPlayer, effectResult.patch);
      player.position = next.position;
      player.lap = next.lap;
      player.coins = next.coins;
      player.exp = next.exp;
      player.skipNext = next.skipNext;

      const card: CardDto = {
        id: picked.id,
        deck: picked.deck,
        title: picked.title,
        body: picked.body,
        effect: picked.effect,
      };

      return { card, effectResult, player: next };
    },
  };
}

export function createMemoryHintService() {
  return {
    async requestHint(input: {
      questionId: string;
      sessionId: string;
      playerId: string;
    }) {
      const session = requireHintSession(input.sessionId);
      if (session.status !== "ACTIVE") {
        throw new HintError("Session is not active", "NOT_ACTIVE");
      }
      const player = session.players.find((p) => p.id === input.playerId);
      if (!player) throw new HintError("Player not found", "NOT_FOUND");
      if (player.coins < HINT_COST) {
        throw new HintError("Not enough coins", "INSUFFICIENT_COINS");
      }
      const question = getQuestionById(input.questionId);
      if (!question) throw new HintError("Question not found", "NOT_FOUND");

      player.coins -= HINT_COST;
      const hint =
        question.hintTh ??
        question.hint ??
        "คิดถึงบริบทประโยคและคำที่สุภาพ/ถูกต้องตามหลักไวยากรณ์";

      return { hint, coinsDelta: -HINT_COST };
    },

    async enrichExplanation(input: {
      questionId: string;
      isCorrect: boolean;
      fallbackExplanation: string;
    }) {
      const question = getQuestionById(input.questionId);
      return (
        question?.explanationTh ??
        (input.isCorrect
          ? `ถูกต้อง — ${input.fallbackExplanation}`
          : `ยังไม่ถูก — ${input.fallbackExplanation}`)
      );
    },
  };
}

export function createMemoryTranslateService() {
  return {
    async translateQuestion(questionId: string): Promise<TranslationResult> {
      const question = getQuestionById(questionId);
      if (!question) throw new TranslateError("Question not found", "NOT_FOUND");

      return {
        stemTh: question.stemTh ?? `[TH] ${question.stem}`,
        passageTh: question.passage ? `[TH] ${question.passage}` : null,
        choicesTh: question.choices.map((c) => ({
          choiceId: c.id,
          labelTh: `[TH] ${c.label}`,
        })),
      };
    },
  };
}

export type MemoryGameService = ReturnType<typeof createMemoryGameService>;
export type MemoryQuizService = ReturnType<typeof createMemoryQuizService>;
