import { useEffect } from "react";
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
  const { speakOnce, speakSequence, stop, isSpeaking } = useTextToSpeech();

  useEffect(() => {
    if (feedback != null) return;

    const lines = [
      question.question,
      ...question.options.map((opt, i) => `${LABELS[i]}. ${opt}`),
    ];

    const timer = window.setTimeout(() => {
      speakSequence(lines);
    }, 500);

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
        className="pointer-events-auto absolute inset-x-0 bottom-4 z-30 flex justify-center px-3 sm:bottom-8"
      >
        <div
          key={question.id}
          className="w-full max-w-lg rounded-3xl border border-white/25 bg-white/15 p-4 shadow-2xl backdrop-blur-xl sm:p-5"
        >
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
              isSpeaking={isSpeaking}
              label="Read question aloud"
            />
          </div>

          <div className="mt-4 grid gap-2.5">
            {question.options.map((opt, i) => {
              const isSelected = feedback?.selectedIndex === i;
              const showCorrect = feedback && isSelected && feedback.correct;
              const showWrong = feedback && isSelected && !feedback.correct;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled || feedback != null}
                  onClick={() => onAnswer(i)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-90 sm:text-base ${
                    showCorrect
                      ? "border-green-400 bg-green-500/40 text-white"
                      : showWrong
                        ? "border-red-400 bg-red-500/40 text-white"
                        : "border-white/20 bg-black/25 text-white hover:border-white/40 hover:bg-black/35"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                    {LABELS[i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  <SpeakButton
                    text={`${LABELS[i]}. ${opt}`}
                    onSpeak={speakOnce}
                    isSpeaking={isSpeaking}
                    label={`Read answer ${LABELS[i]}`}
                    size="sm"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
