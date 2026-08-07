import bank from "@/data/toeic-questions.json";
import { TOTAL_QUESTIONS } from "./prize-ladder";

export type HotseatDifficulty = "EASY" | "MEDIUM" | "HARD";

export type HotseatChoice = {
  id: string;
  label: string;
  isCorrect: boolean;
  sortOrder: number;
};

export type HotseatQuestion = {
  id: string;
  category: string;
  difficulty: HotseatDifficulty;
  stem: string;
  passage: string | null;
  explanation: string | null;
  hint: string | null;
  stemTh: string | null;
  choices: HotseatChoice[];
};

const LETTERS = ["A", "B", "C", "D"] as const;
export type ChoiceLetter = (typeof LETTERS)[number];

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function difficultyForStep(
  step: number,
  lobby: HotseatDifficulty,
): HotseatDifficulty {
  // step is 1..15
  if (lobby === "EASY") {
    if (step <= 8) return "EASY";
    if (step <= 13) return "MEDIUM";
    return "HARD";
  }
  if (lobby === "HARD") {
    if (step <= 3) return "EASY";
    if (step <= 8) return "MEDIUM";
    return "HARD";
  }
  // MEDIUM default
  if (step <= 5) return "EASY";
  if (step <= 10) return "MEDIUM";
  return "HARD";
}

function asQuestion(raw: (typeof bank)[number]): HotseatQuestion {
  return {
    id: raw.id,
    category: raw.category,
    difficulty: raw.difficulty as HotseatDifficulty,
    stem: raw.stem,
    passage: raw.passage ?? null,
    explanation: raw.explanation ?? null,
    hint: raw.hint ?? null,
    stemTh: raw.stemTh ?? null,
    choices: raw.choices.map((c) => ({
      id: c.id,
      label: c.label,
      isCorrect: Boolean(c.isCorrect),
      sortOrder: c.sortOrder,
    })),
  };
}

/** Build a unique 15-question run from the embedded TOEIC bank. */
export function buildHotseatDeck(lobby: HotseatDifficulty): HotseatQuestion[] {
  const all = (bank as typeof bank).map(asQuestion);
  const byDiff: Record<HotseatDifficulty, HotseatQuestion[]> = {
    EASY: shuffle(all.filter((q) => q.difficulty === "EASY")),
    MEDIUM: shuffle(all.filter((q) => q.difficulty === "MEDIUM")),
    HARD: shuffle(all.filter((q) => q.difficulty === "HARD")),
  };
  const used = new Set<string>();
  const deck: HotseatQuestion[] = [];

  for (let step = 1; step <= TOTAL_QUESTIONS; step += 1) {
    const want = difficultyForStep(step, lobby);
    const order: HotseatDifficulty[] =
      want === "EASY"
        ? ["EASY", "MEDIUM", "HARD"]
        : want === "MEDIUM"
          ? ["MEDIUM", "EASY", "HARD"]
          : ["HARD", "MEDIUM", "EASY"];

    let picked: HotseatQuestion | undefined;
    for (const d of order) {
      picked = byDiff[d].find((q) => !used.has(q.id));
      if (picked) break;
    }
    if (!picked) {
      picked = all.find((q) => !used.has(q.id));
    }
    if (!picked) break;

    used.add(picked.id);
    deck.push({
      ...picked,
      choices: shuffle(picked.choices).map((c, i) => ({
        ...c,
        sortOrder: i,
      })),
    });
  }

  return deck;
}

export function letterForIndex(i: number): ChoiceLetter {
  return LETTERS[i] ?? "A";
}

/** Replace current question with another unused one of similar difficulty. */
export function pickReplacementQuestion(
  excludeIds: Set<string> | string[],
  step: number,
  lobby: HotseatDifficulty,
): HotseatQuestion | null {
  const exclude = excludeIds instanceof Set ? excludeIds : new Set(excludeIds);
  const all = (bank as typeof bank).map(asQuestion);
  const want = difficultyForStep(step, lobby);
  const order: HotseatDifficulty[] =
    want === "EASY"
      ? ["EASY", "MEDIUM", "HARD"]
      : want === "MEDIUM"
        ? ["MEDIUM", "EASY", "HARD"]
        : ["HARD", "MEDIUM", "EASY"];

  const pools = order.map((d) =>
    shuffle(all.filter((q) => q.difficulty === d && !exclude.has(q.id))),
  );
  const picked = pools.flat()[0] ?? all.find((q) => !exclude.has(q.id));
  if (!picked) return null;
  return {
    ...picked,
    choices: shuffle(picked.choices).map((c, i) => ({
      ...c,
      sortOrder: i,
    })),
  };
}
