export const HOTSEAT_SESSION_KEY = "toeic_hotseat_session";

export type HotseatSessionConfig = {
  displayName: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  createdAt: number;
};

export function saveHotseatSession(config: HotseatSessionConfig): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(HOTSEAT_SESSION_KEY, JSON.stringify(config));
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
}
