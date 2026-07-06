import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnswerFeedback, Question } from "../game/types";
import { difficultyLabel } from "../lib/i18n";
import { QuestionIllustration } from "./QuestionIllustration";
import { SpeakButton } from "./SpeakButton";
import { useTextToSpeech } from "../hooks/useTextToSpeech";

interface Props {
  question: Question;
  onAnswer: (index: number) => void;
  disabled?: boolean;
  feedback: AnswerFeedback | null;
}

const LABELS = ["A", "B", "C"];

export function FloatingQuestionCard({
  question,
  onAnswer,
  disabled,
  feedback,
}: Props) {
  const { speakOnce, speakSequence, stop, stopForAnswer, isSpeaking } = useTextToSpeech();
  const answeringRef = useRef(false);

  const pickAnswer = (index: number) => {
    if (disabled || feedback != null || answeringRef.current) return;
    answeringRef.current = true;
    stopForAnswer();
    onAnswer(index);
  };

  useEffect(() => {
    answeringRef.current = false;
  }, [question.id]);

  useEffect(() => {
    if (feedback == null) answeringRef.current = false;
  }, [feedback]);

  useEffect(() => {
    if (feedback != null) return;

    const lines = [
      question.question,
      ...question.options.map((opt, i) => `${LABELS[i]}. ${opt}`),
    ];

    const timer = window.setTimeout(() => {
      speakSequence(lines);
    }, 650);

    return () => {
      window.clearTimeout(timer);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-read once per question id
  }, [question.id, feedback]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="pointer-events-auto absolute inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-4 pt-2 sm:pb-8"
      >
        <div
          key={question.id}
          className="flex max-h-[min(72vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/25 bg-white/15 shadow-2xl backdrop-blur-xl"
        >
          <div className="overflow-y-auto overscroll-contain p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="rounded-full bg-violet-500/30 px-2.5 py-0.5 text-xs font-medium text-violet-100">
                {difficultyLabel(question.difficulty)}
              </span>
              <span className="text-xs text-white/60">
                {isSpeaking ? "🔊 กำลังอ่าน…" : "กดลำโพงเพื่อฟังซ้ำ"}
              </span>
            </div>

            {question.image && (
              <QuestionIllustration
                image={question.image}
                imageFocus={question.image_focus}
                alt="Question illustration"
              />
            )}

            <div className="flex items-start gap-2">
              <h2 className="flex-1 text-base font-bold leading-snug text-white sm:text-lg">
                {question.question}
              </h2>
              <SpeakButton
                text={question.question}
                onSpeak={speakOnce}
                label="Read question aloud"
              />
            </div>

            <div className="mt-4 grid gap-2.5">
              {question.options.map((opt, i) => {
                const isSelected = feedback?.selectedIndex === i;
                const showCorrect = feedback && isSelected && feedback.correct;
                const showWrong = feedback && isSelected && !feedback.correct;
                const locked = Boolean(disabled || feedback != null);
                const rowClass = `flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition-all touch-manipulation sm:px-4 sm:py-3.5 ${
                  showCorrect
                    ? "border-green-400 bg-green-500/40"
                    : showWrong
                      ? "border-red-400 bg-red-500/40"
                      : locked
                        ? "border-white/20 bg-black/25 opacity-80"
                        : "cursor-pointer border-white/20 bg-black/25 hover:border-white/40 hover:bg-black/35 active:scale-[0.99]"
                }`;

                return (
                  <div
                    key={i}
                    role="button"
                    tabIndex={locked ? -1 : 0}
                    aria-disabled={locked}
                    onClick={() => pickAnswer(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        pickAnswer(i);
                      }
                    }}
                    className={rowClass}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                      {LABELS[i]}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-white sm:text-base">
                      {opt}
                    </span>
                    <SpeakButton
                      text={`${LABELS[i]}. ${opt}`}
                      onSpeak={speakOnce}
                      label={`Read answer ${LABELS[i]}`}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
