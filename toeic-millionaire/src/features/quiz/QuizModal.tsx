"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExplanationPanel } from "@/features/quiz/components/ExplanationPanel";
import { QuestionThPanel } from "@/features/quiz/components/QuestionThPanel";
import {
  TranslateThButton,
  useQuestionTranslation,
} from "@/features/quiz/components/TranslateThButton";
import type { QuizChoiceDto } from "@/features/quiz/quiz-service";

export interface QuizModalQuestion {
  questionId: string;
  stem: string;
  passage: string | null;
  choices: QuizChoiceDto[];
}

export interface QuizAnswerResult {
  isCorrect: boolean;
  coinsDelta: number;
  expDelta: number;
  explanation: string;
  explanationTh: string;
  streak: number;
}

interface QuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: QuizModalQuestion | null;
  sessionId: string;
  playerId: string;
  onAnswered?: (result: QuizAnswerResult) => void;
}

const CHOICE_LETTERS = ["A", "B", "C", "D", "E"];

export function QuizModal({
  open,
  onOpenChange,
  question,
  sessionId,
  playerId,
  onAnswered,
}: QuizModalProps) {
  const [showTh, setShowTh] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<QuizAnswerResult | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const questionId = question?.questionId ?? "";
  const { data, isLoading, isError, refetch } = useQuestionTranslation(
    questionId,
    showTh && Boolean(questionId),
  );

  const choiceLabels = Object.fromEntries(
    (question?.choices ?? []).map((choice, index) => [
      choice.id,
      CHOICE_LETTERS[index] ?? String(index + 1),
    ]),
  );

  const answered = answerResult !== null;

  function resetState() {
    setShowTh(false);
    setSelectedChoiceId(null);
    setHint(null);
    setHintUsed(false);
    setHintLoading(false);
    setHintError(null);
    setAnswerResult(null);
    setSubmitting(false);
  }

  async function handleHint() {
    if (!question || hintUsed || hintLoading || answered) {
      return;
    }

    setHintLoading(true);
    setHintError(null);

    try {
      const res = await fetch("/api/quiz/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.questionId,
          sessionId,
          playerId,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Failed to load hint");
      }

      const payload = (await res.json()) as { hint: string; coinsDelta: number };
      setHint(payload.hint);
      setHintUsed(true);
    } catch (err) {
      setHintError(err instanceof Error ? err.message : "Failed to load hint");
    } finally {
      setHintLoading(false);
    }
  }

  async function handleSubmit() {
    if (!question || !selectedChoiceId || submitting || answered) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          playerId,
          questionId: question.questionId,
          choiceId: selectedChoiceId,
          responseMs: 0,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit answer");
      }

      const result = (await res.json()) as QuizAnswerResult;
      setAnswerResult(result);
      onAnswered?.(result);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          resetState();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="relative pr-8">
          <DialogTitle>Quiz</DialogTitle>
          {question ? (
            <div className="absolute top-0 right-0">
              <TranslateThButton
                showTh={showTh}
                isLoading={isLoading}
                onToggle={setShowTh}
              />
            </div>
          ) : null}
        </DialogHeader>

        {question ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm leading-relaxed">{question.stem}</p>
              {question.passage ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {question.passage}
                </p>
              ) : null}
              <ul className="space-y-2">
                {question.choices.map((choice, index) => (
                  <li key={choice.id}>
                    <button
                      type="button"
                      disabled={answered || submitting}
                      onClick={() => setSelectedChoiceId(choice.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selectedChoiceId === choice.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      } disabled:opacity-60`}
                    >
                      <span className="mr-2 font-medium text-muted-foreground">
                        {CHOICE_LETTERS[index] ?? index + 1}.
                      </span>
                      {choice.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {!answered ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={hintUsed || hintLoading}
                  onClick={() => void handleHint()}
                >
                  {hintLoading ? "กำลังโหลด..." : "💡 Hint (-5 coins)"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedChoiceId || submitting}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? "กำลังส่ง..." : "Submit"}
                </Button>
              </div>
            ) : null}

            {hintError ? (
              <p className="text-xs text-destructive">{hintError}</p>
            ) : null}

            {hint ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  Hint
                </p>
                <p className="leading-relaxed">{hint}</p>
              </div>
            ) : null}

            {showTh ? (
              <QuestionThPanel
                translation={data}
                isLoading={isLoading}
                isError={isError}
                onRetry={() => void refetch()}
                choiceLabels={choiceLabels}
              />
            ) : null}

            {answerResult ? (
              <ExplanationPanel
                isCorrect={answerResult.isCorrect}
                explanationTh={answerResult.explanationTh}
              />
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
