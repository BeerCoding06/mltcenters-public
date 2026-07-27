import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

export const QUESTION_CATEGORIES = [
  "VOCABULARY",
  "GRAMMAR",
  "READING",
  "LISTENING",
  "BUSINESS_ENGLISH",
] as const;

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface QuestionChoice {
  label: string;
  isCorrect: boolean;
}

export interface SeedQuestion {
  id?: string;
  category: QuestionCategory;
  type?: string;
  difficulty: Difficulty;
  stem: string;
  passage?: string | null;
  audioUrl?: string | null;
  explanation: string;
  hint?: string | null;
  choices: QuestionChoice[];
}

export interface ValidationIssue {
  file: string;
  index: number;
  id?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  files: string[];
  totalQuestions: number;
  byCategory: Record<string, number>;
  issues: ValidationIssue[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
export const QUESTIONS_DIR = join(__dirname, "data", "questions");

function loadQuestionFiles(dir = QUESTIONS_DIR): { file: string; questions: SeedQuestion[] }[] {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  return files.map((file) => {
    const raw = readFileSync(join(dir, file), "utf-8");
    const parsed = JSON.parse(raw) as SeedQuestion[] | SeedQuestion;
    const questions = Array.isArray(parsed) ? parsed : [parsed];
    return { file, questions };
  });
}

export function validateQuestion(
  question: SeedQuestion,
  file: string,
  index: number,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ctx = { file, index, id: question.id };

  if (!QUESTION_CATEGORIES.includes(question.category)) {
    issues.push({ ...ctx, message: `Invalid category: ${question.category}` });
  }
  if (!DIFFICULTIES.includes(question.difficulty)) {
    issues.push({ ...ctx, message: `Invalid difficulty: ${question.difficulty}` });
  }
  if (!question.stem?.trim()) {
    issues.push({ ...ctx, message: "Missing stem" });
  }
  if (!question.explanation?.trim()) {
    issues.push({ ...ctx, message: "Missing explanation" });
  }
  if (!Array.isArray(question.choices) || question.choices.length !== 4) {
    issues.push({
      ...ctx,
      message: `Expected exactly 4 choices, got ${question.choices?.length ?? 0}`,
    });
    return issues;
  }

  const correctCount = question.choices.filter((c) => c.isCorrect).length;
  if (correctCount !== 1) {
    issues.push({
      ...ctx,
      message: `Expected exactly 1 correct choice, got ${correctCount}`,
    });
  }

  for (const [i, choice] of question.choices.entries()) {
    if (!choice.label?.trim()) {
      issues.push({ ...ctx, message: `Choice ${i + 1} has empty label` });
    }
  }

  const labels = question.choices.map((c) => c.label.trim().toLowerCase());
  if (new Set(labels).size !== labels.length) {
    issues.push({ ...ctx, message: "Duplicate choice labels" });
  }

  return issues;
}

export function validateAllQuestions(dir = QUESTIONS_DIR): ValidationResult {
  const loaded = loadQuestionFiles(dir);
  const issues: ValidationIssue[] = [];
  const byCategory: Record<string, number> = {};
  let totalQuestions = 0;

  for (const { file, questions } of loaded) {
    totalQuestions += questions.length;
    for (const [index, question] of questions.entries()) {
      byCategory[question.category] = (byCategory[question.category] ?? 0) + 1;
      issues.push(...validateQuestion(question, file, index));
    }
  }

  return {
    valid: issues.length === 0,
    files: loaded.map((l) => l.file),
    totalQuestions,
    byCategory,
    issues,
  };
}

export function assertQuestionsValid(dir = QUESTIONS_DIR): ValidationResult {
  const result = validateAllQuestions(dir);
  if (!result.valid) {
    const summary = result.issues
      .slice(0, 5)
      .map((i) => `${i.file}[${i.index}]: ${i.message}`)
      .join("\n");
    throw new Error(
      `Question validation failed (${result.issues.length} issues):\n${summary}`,
    );
  }
  return result;
}
