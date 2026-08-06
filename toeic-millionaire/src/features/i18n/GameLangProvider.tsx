"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { messages, type GameLang } from "@/features/i18n/messages";

const STORAGE_KEY = "toeic_ui_lang";

let currentLang: GameLang = "th";

export function getGameLang(): GameLang {
  return currentLang;
}

export function getMessages(lang: GameLang = currentLang) {
  return messages[lang];
}

interface GameLangContextValue {
  lang: GameLang;
  setLang: (lang: GameLang) => void;
  toggleLang: () => void;
  t: (typeof messages)["th"];
  isTh: boolean;
}

const GameLangContext = createContext<GameLangContextValue | null>(null);

function readStoredLang(): GameLang {
  if (typeof window === "undefined") return "th";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "th" ? stored : "th";
}

export function GameLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<GameLang>("th");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLang();
    setLangState(stored);
    currentLang = stored;
    setReady(true);
  }, []);

  const setLang = useCallback((next: GameLang) => {
    setLangState(next);
    currentLang = next;
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === "th" ? "th" : "en";
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "th" ? "en" : "th");
  }, [lang, setLang]);

  const value = useMemo<GameLangContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t: messages[lang],
      isTh: lang === "th",
    }),
    [lang, setLang, toggleLang],
  );

  // Avoid flashing wrong language before localStorage read
  if (!ready) {
    return (
      <GameLangContext.Provider value={value}>
        {children}
      </GameLangContext.Provider>
    );
  }

  return (
    <GameLangContext.Provider value={value}>{children}</GameLangContext.Provider>
  );
}

export function useGameLang() {
  const ctx = useContext(GameLangContext);
  if (!ctx) {
    throw new Error("useGameLang must be used within GameLangProvider");
  }
  return ctx;
}
