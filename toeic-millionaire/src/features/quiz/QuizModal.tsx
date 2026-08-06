"use client";

import { useState } from "react";
import { Languages, Lightbulb } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

function choiceStateClass(
  choiceId: string,
  selectedChoiceId: string | null,
  answered: boolean,
  isCorrect: boolean | null,
): string {
  if (!answered || selectedChoiceId !== choiceId) {
    return selectedChoiceId === choiceId ? "millionaire-choice-selected" : "";
  }
  return isCorrect ? "millionaire-choice-correct" : "millionaire-choice-wrong";
}

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
      String(index + 1),
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
      <DialogContent className="border-[var(--millionaire-silver)] bg-black/95 text-white ring-[var(--millionaire-silver)]/30 sm:max-w-xl">
        <DialogHeader className="relative">
          <DialogTitle className="sr-only">Quiz</DialogTitle>
          {question ? (
            <div className="absolute top-0 right-0 flex gap-2">
              <TranslateThButton
                showTh={showTh}
                isLoading={isLoading}
                onToggle={setShowTh}
              />
              <button
                type="button"
                title="Hint (-5 coins)"
                disabled={hintUsed || hintLoading || answered}
                onClick={() => void handleHint()}
                className={cn(
                  "millionaire-lifeline",
                  hintUsed && "millionaire-lifeline-active",
                )}
              >
                {hintLoading ? (
                  <span className="text-xs">…</span>
                ) : (
                  <Lightbulb className="size-4" />
                )}
              </button>
            </div>
          ) : null}
        </DialogHeader>

        {question ? (
          <div className="space-y-4 pt-2">
            <div className="millionaire-pill space-y-2">
              <p className="text-sm leading-relaxed">{question.stem}</p>
              {question.passage ? (
                <p className="text-sm leading-relaxed text-[var(--millionaire-silver)]">
                  {question.passage}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {question.choices.map((choice, index) => (
                <button
                  key={choice.id}
                  type="button"
                  disabled={answered || submitting}
                  onClick={() => setSelectedChoiceId(choice.id)}
                  className={cn(
                    "millionaire-choice",
                    choiceStateClass(
                      choice.id,
                      selectedChoiceId,
                      answered,
                      answerResult?.isCorrect ?? null,
                    ),
                  )}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--millionaire-gold)] text-xs font-bold text-[var(--millionaire-gold)]">
                    {index + 1}
                  </span>
                  <span className="line-clamp-3">{choice.label}</span>
                </button>
              ))}
            </div>

            {!answered ? (
              <div className="flex justify-center pt-1">
                <Button
                  type="button"
                  size="lg"
                  disabled={!selectedChoiceId || submitting}
                  onClick={() => void handleSubmit()}
                  className="rounded-full border-2 border-[var(--millionaire-gold)] bg-[var(--millionaire-gold)] px-8 font-semibold text-black hover:bg-[var(--millionaire-gold)]/90"
                >
                  {submitting ? "กำลังส่ง..." : "Submit"}
                </Button>
              </div>
            ) : null}

            {hintError ? (
              <p className="text-center text-xs text-[var(--millionaire-wrong)]">
                {hintError}
              </p>
            ) : null}

            {hint ? (
              <div className="millionaire-pill border-[var(--millionaire-gold)]/60 text-sm">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--millionaire-gold)]">
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
