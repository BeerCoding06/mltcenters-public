export const HOTSEAT_SESSION_KEY = "toeic_hotseat_session";
export const HOTSEAT_HISTORY_KEY = "toeic_hotseat_history";

export type HotseatSessionConfig = {
  displayName: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  createdAt: number;
};

export type HotseatReviewItem = {
  step: number;
  questionId: string;
  stem: string;
  passage: string | null;
  selectedId: string;
  selectedLabel: string;
  correctId: string;
  correctLabel: string;
  isCorrect: boolean;
  explanation: string;
  score: number;
  at: number;
};

export function saveHotseatSession(config: HotseatSessionConfig): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(HOTSEAT_SESSION_KEY, JSON.stringify(config));
  // Fresh run clears previous review log
  sessionStorage.setItem(HOTSEAT_HISTORY_KEY, JSON.stringify([]));
}

export function loadHotseatSession(): HotseatSessionConfig | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(HOTSEAT_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as HotseatSessionConfig;
    if (!parsed.displayName || !parsed.difficulty) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearHotseatSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(HOTSEAT_SESSION_KEY);
  sessionStorage.removeItem(HOTSEAT_HISTORY_KEY);
}

export function loadHotseatHistory(): HotseatReviewItem[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(HOTSEAT_HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as HotseatReviewItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendHotseatHistory(item: HotseatReviewItem): HotseatReviewItem[] {
  const next = [...loadHotseatHistory(), item];
  sessionStorage.setItem(HOTSEAT_HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function saveHotseatHistory(items: HotseatReviewItem[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(HOTSEAT_HISTORY_KEY, JSON.stringify(items));
}
