import { create } from "zustand";
import type { TileAction } from "./types";
import type { CardDto } from "@/features/cards/card-service";
import type { EffectResult } from "@/features/cards/effects";
import type { QuizModalQuestion } from "@/features/quiz/QuizModal";

interface GameUIState {
  humanPlayerId: string | null;
  displayName: string;
  isRolling: boolean;
  lastDice: number | null;
  diceAnimating: boolean;
  pendingTileAction: TileAction | null;
  actionBlocked: boolean;
  quizOpen: boolean;
  quizQuestion: QuizModalQuestion | null;
  cardOpen: boolean;
  cardDeck: "LUCKY" | "EVENT" | null;
  cardData: CardDto | null;
  cardEffect: EffectResult | null;
  cardLoading: boolean;
  setHumanPlayerId: (id: string) => void;
  setDisplayName: (name: string) => void;
  setIsRolling: (v: boolean) => void;
  setLastDice: (v: number | null) => void;
  setDiceAnimating: (v: boolean) => void;
  setPendingTileAction: (a: TileAction | null) => void;
  setActionBlocked: (v: boolean) => void;
  openQuiz: (question: QuizModalQuestion) => void;
  closeQuiz: () => void;
  openCardDraw: (deck: "LUCKY" | "EVENT") => void;
  setCardResult: (card: CardDto, effect: EffectResult) => void;
  setCardLoading: (v: boolean) => void;
  closeCard: () => void;
  resetModals: () => void;
}

export const useGameStore = create<GameUIState>((set) => ({
  humanPlayerId: null,
  displayName: "Player",
  isRolling: false,
  lastDice: null,
  diceAnimating: false,
  pendingTileAction: null,
  actionBlocked: false,
  quizOpen: false,
  quizQuestion: null,
  cardOpen: false,
  cardDeck: null,
  cardData: null,
  cardEffect: null,
  cardLoading: false,
  setHumanPlayerId: (id) => set({ humanPlayerId: id }),
  setDisplayName: (name) => set({ displayName: name }),
  setIsRolling: (v) => set({ isRolling: v }),
  setLastDice: (v) => set({ lastDice: v }),
  setDiceAnimating: (v) => set({ diceAnimating: v }),
  setPendingTileAction: (a) => set({ pendingTileAction: a }),
  setActionBlocked: (v) => set({ actionBlocked: v }),
  openQuiz: (question) =>
    set({ quizOpen: true, quizQuestion: question, actionBlocked: true }),
  closeQuiz: () =>
    set({ quizOpen: false, quizQuestion: null, actionBlocked: false }),
  openCardDraw: (deck) =>
    set({
      cardOpen: true,
      cardDeck: deck,
      cardData: null,
      cardEffect: null,
      cardLoading: true,
      actionBlocked: true,
    }),
  setCardResult: (card, effect) =>
    set({ cardData: card, cardEffect: effect, cardLoading: false }),
  setCardLoading: (v) => set({ cardLoading: v }),
  closeCard: () =>
    set({
      cardOpen: false,
      cardDeck: null,
      cardData: null,
      cardEffect: null,
      cardLoading: false,
      actionBlocked: false,
    }),
  resetModals: () =>
    set({
      quizOpen: false,
      quizQuestion: null,
      cardOpen: false,
      cardDeck: null,
      cardData: null,
      cardEffect: null,
      cardLoading: false,
      actionBlocked: false,
      pendingTileAction: null,
    }),
}));
