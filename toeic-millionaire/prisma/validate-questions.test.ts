import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  validateAllQuestions,
  assertQuestionsValid,
  QUESTIONS_DIR,
} from "./validate-questions";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CARDS_PATH = join(__dirname, "data", "cards.json");

describe("validate-questions", () => {
  it("validates all question JSON files", () => {
    const result = assertQuestionsValid();
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("meets minimum question counts per category", () => {
    const { byCategory, totalQuestions } = validateAllQuestions();
    expect(byCategory.VOCABULARY).toBeGreaterThanOrEqual(50);
    expect(byCategory.GRAMMAR).toBeGreaterThanOrEqual(50);
    expect(byCategory.READING).toBeGreaterThanOrEqual(25);
    expect(byCategory.LISTENING).toBeGreaterThanOrEqual(25);
    expect(byCategory.BUSINESS_ENGLISH).toBeGreaterThanOrEqual(25);
    expect(totalQuestions).toBeGreaterThanOrEqual(175);
    expect(totalQuestions).toBeGreaterThanOrEqual(250);
  });

  it("each question has exactly 4 choices and 1 correct", () => {
    const result = validateAllQuestions();
    for (const issue of result.issues) {
      expect(issue.message).not.toMatch(/choices|correct/i);
    }
    expect(result.issues).toHaveLength(0);
  });
});

describe("cards.json", () => {
  it("has exactly 40 cards with LUCKY and EVENT decks", () => {
    const cards = JSON.parse(readFileSync(CARDS_PATH, "utf-8")) as {
      id: string;
      deck: string;
      effect: Record<string, unknown>;
    }[];
    expect(cards).toHaveLength(40);

    const lucky = cards.filter((c) => c.deck === "LUCKY");
    const event = cards.filter((c) => c.deck === "EVENT");
    expect(lucky.length).toBeGreaterThan(0);
    expect(event.length).toBeGreaterThan(0);
    expect(lucky.length + event.length).toBe(40);

    for (const card of cards) {
      expect(card.id).toBeTruthy();
      expect(card.effect).toBeTruthy();
      expect(typeof card.effect.type).toBe("string");
    }
  });
});

describe("questions directory", () => {
  it("loads from committed JSON (no DB required)", () => {
    expect(QUESTIONS_DIR).toContain("questions");
    const result = validateAllQuestions();
    expect(result.files.length).toBeGreaterThanOrEqual(5);
  });
});
