"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface QuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: QuizModalQuestion | null;
}

const CHOICE_LETTERS = ["A", "B", "C", "D", "E"];

export function QuizModal({ open, onOpenChange, question }: QuizModalProps) {
  const [showTh, setShowTh] = useState(false);

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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setShowTh(false);
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
                  <li
                    key={choice.id}
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="mr-2 font-medium text-muted-foreground">
                      {CHOICE_LETTERS[index] ?? index + 1}.
                    </span>
                    {choice.label}
                  </li>
                ))}
              </ul>
            </div>

            {showTh ? (
              <QuestionThPanel
                translation={data}
                isLoading={isLoading}
                isError={isError}
                onRetry={() => void refetch()}
                choiceLabels={choiceLabels}
              />
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
