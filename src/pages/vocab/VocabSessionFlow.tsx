import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { ANALYTICS_EVENTS } from '@/analytics/analytics-context';
import { useAnalytics } from '@/analytics/useAnalytics';
import { PageLoader } from '@/components/PageLoader';
import { completeSession, startSession, submitSessionAnswer } from '@/vocab/api';
import type { VocabAnswerResult, VocabSessionItem, VocabSessionMode } from '@/vocab/types';

type Phase = 'loading' | 'error' | 'card' | 'quiz' | 'feedback' | 'done';

interface VocabSessionFlowProps {
  mode: VocabSessionMode;
  showCard?: boolean;
}

export function VocabSessionFlow({ mode, showCard = mode === 'learn' }: VocabSessionFlowProps) {
  const { lang, t } = useI18n();
  const { track } = useAnalytics();
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<VocabSessionItem[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<VocabAnswerResult | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const questionStart = useRef(Date.now());
  const trackedStart = useRef(false);

  const item = items[index];
  const progress = items.length ? ((index + (phase === 'done' ? 1 : 0)) / items.length) * 100 : 0;

  const beginSession = useCallback(async () => {
    setPhase('loading');
    setError(null);
    setIndex(0);
    setRevealed(false);
    setAnswer('');
    setResult(null);
    setTotalXp(0);
    setCorrectCount(0);
    trackedStart.current = false;
    try {
      const session = await startSession(mode);
      if (!session.items.length) {
        setError(t.vocabPage.session.noItems[lang]);
        setPhase('error');
        return;
      }
      setSessionId(session.sessionId);
      setItems(session.items);
      if (!trackedStart.current) {
        track(ANALYTICS_EVENTS.VOCAB_SESSION_STARTED, { mode });
        trackedStart.current = true;
      }
      setPhase(showCard ? 'card' : 'quiz');
      questionStart.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.vocabPage.session.error[lang]);
      setPhase('error');
    }
  }, [lang, mode, showCard, t.vocabPage.session, track]);

  useEffect(() => {
    void beginSession();
  }, [beginSession]);

  const finishSession = async (sid: string, xp: number) => {
    try {
      await completeSession(sid);
    } catch {
      /* still show done state */
    }
    toast.success(t.vocabPage.session.xpToast[lang].replace('{xp}', String(xp)));
    setPhase('done');
  };

  const goNext = async () => {
    setAnswer('');
    setResult(null);
    setRevealed(false);
    if (index + 1 >= items.length) {
      if (sessionId) await finishSession(sessionId, totalXp);
      return;
    }
    setIndex((i) => i + 1);
    setPhase(showCard ? 'card' : 'quiz');
    questionStart.current = Date.now();
  };

  const handleSubmit = async () => {
    if (!item || !sessionId || !answer.trim()) return;
    setSubmitting(true);
    const responseMs = Date.now() - questionStart.current;
    try {
      const res = await submitSessionAnswer(sessionId, {
        wordId: item.wordId,
        quizType: item.quizType,
        userAnswer: answer.trim(),
        responseMs,
        confidence: 4,
      });
      setResult(res);
      setTotalXp((xp) => xp + res.xpDelta);
      if (res.isCorrect) setCorrectCount((c) => c + 1);

      track(ANALYTICS_EVENTS.VOCAB_QUIZ_ANSWERED, {
        wordId: item.wordId,
        quizType: item.quizType,
        isCorrect: res.isCorrect,
        mode,
      });
      if (mode === 'learn' && res.isCorrect) {
        track(ANALYTICS_EVENTS.VOCAB_WORD_LEARNED, { wordId: item.wordId });
      }

      setPhase('feedback');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.vocabPage.session.error[lang]);
      setPhase('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'loading') return <PageLoader />;

  if (phase === 'error') {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
        <p className="text-muted-foreground">{error || t.vocabPage.session.error[lang]}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => void beginSession()}
            className="rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold px-6 py-3"
          >
            {t.vocabPage.session.retry[lang]}
          </button>
          <Link
            to="/vocab"
            className="rounded-2xl border border-border bg-white font-medium px-6 py-3 hover:bg-muted"
          >
            {t.vocabPage.session.backDashboard[lang]}
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pastel-card p-8 text-center space-y-4"
        >
          <h2 className="text-2xl font-bold heading-gradient">{t.vocabPage.session.completeTitle[lang]}</h2>
          <p className="text-muted-foreground">{t.vocabPage.session.completeSubtitle[lang]}</p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl bg-[#5BC0FF]/10 p-4">
              <p className="text-xs text-muted-foreground">{t.vocabPage.session.xpEarned[lang]}</p>
              <p className="text-2xl font-bold text-[#5BC0FF]">+{totalXp} XP</p>
            </div>
            <div className="rounded-2xl bg-[#6EE7B7]/20 p-4">
              <p className="text-xs text-muted-foreground">{t.vocabPage.session.correctCount[lang]}</p>
              <p className="text-2xl font-bold text-foreground">
                {correctCount}/{items.length}
              </p>
            </div>
          </div>
          <Link
            to="/vocab"
            className="inline-block mt-4 rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold px-8 py-3"
          >
            {t.vocabPage.session.backDashboard[lang]}
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!item) return <PageLoader />;

  const promptWord = item.prompt.word || items.find((i) => i.wordId === item.wordId)?.prompt.word;

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {t.vocabPage.session.progress[lang]} {index + 1}/{items.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {phase === 'card' && (
        <motion.div
          key={`card-${item.wordId}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pastel-card p-8 text-center space-y-4"
        >
          <p className="text-3xl font-bold text-foreground">{item.prompt.word}</p>
          {item.prompt.ipa && <p className="text-sm text-muted-foreground">{item.prompt.ipa}</p>}
          {!revealed ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold px-8 py-3"
            >
              {t.vocabPage.learn.reveal[lang]}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-lg font-medium text-[#5BC0FF]">{item.prompt.meaning_th}</p>
              {item.prompt.example_en && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{item.prompt.example_en}</p>
                  {item.prompt.example_th && <p>{item.prompt.example_th}</p>}
                </div>
              )}
              <Link
                to={`/vocab/learn/${item.wordId}`}
                className="inline-block text-xs text-[#5BC0FF] hover:underline"
              >
                {t.vocabPage.learn.viewDetail[lang]}
              </Link>
              <button
                type="button"
                onClick={() => setPhase('quiz')}
                className="block w-full rounded-2xl border border-[#5BC0FF]/40 bg-white font-semibold px-6 py-3 hover:bg-[#5BC0FF]/5"
              >
                {t.vocabPage.learn.startQuiz[lang]}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {(phase === 'quiz' || phase === 'feedback') && (
        <motion.div
          key={`quiz-${item.wordId}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pastel-card p-8 space-y-5"
        >
          <p className="text-sm font-medium text-muted-foreground">{t.vocabPage.quiz.prompt[lang]}</p>

          {item.quizType === 'mcq' && (
            <div className="space-y-3">
              {item.promptMode === 'word_to_meaning' ? (
                <>
                  <p className="text-2xl font-bold text-center">{item.prompt.word}</p>
                  {item.prompt.ipa && (
                    <p className="text-sm text-center text-muted-foreground">{item.prompt.ipa}</p>
                  )}
                </>
              ) : (
                <p className="text-xl font-semibold text-center text-[#5BC0FF]">{item.prompt.meaning_th}</p>
              )}
              <div className="grid gap-2">
                {(item.options || []).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={phase === 'feedback' || submitting}
                    onClick={() => setAnswer(opt)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium text-left transition-all ${
                      answer === opt
                        ? 'border-[#5BC0FF] bg-[#5BC0FF]/10'
                        : 'border-border bg-white hover:border-[#5BC0FF]/40'
                    } ${phase === 'feedback' && opt === item.expected ? 'ring-2 ring-[#6EE7B7]' : ''}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.quizType === 'type' && (
            <div className="space-y-3">
              <p className="text-xl font-semibold text-center text-[#5BC0FF]">{item.prompt.meaning_th}</p>
              <input
                type="text"
                value={answer}
                disabled={phase === 'feedback'}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={t.vocabPage.quiz.typePlaceholder[lang]}
                className="w-full rounded-2xl border border-border px-4 py-3 text-center text-lg"
                autoComplete="off"
              />
            </div>
          )}

          {item.quizType === 'fill' && (
            <div className="space-y-3">
              <p className="text-lg text-center leading-relaxed">{item.prompt.example_en}</p>
              {item.prompt.example_th && (
                <p className="text-sm text-center text-muted-foreground">{item.prompt.example_th}</p>
              )}
              <input
                type="text"
                value={answer}
                disabled={phase === 'feedback'}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={t.vocabPage.quiz.fillPlaceholder[lang]}
                className="w-full rounded-2xl border border-border px-4 py-3 text-center text-lg"
                autoComplete="off"
              />
            </div>
          )}

          {phase === 'feedback' && result && (
            <div
              className={`rounded-2xl p-4 text-center ${
                result.isCorrect ? 'bg-[#6EE7B7]/20' : 'bg-[#FF8FAB]/10'
              }`}
            >
              <p className="font-semibold">
                {result.isCorrect
                  ? t.vocabPage.quiz.correct[lang]
                  : t.vocabPage.quiz.incorrect[lang]}
              </p>
              {!result.isCorrect && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t.vocabPage.quiz.expected[lang]}: {item.expected}
                </p>
              )}
              <p className="text-sm text-[#5BC0FF] mt-1">+{result.xpDelta} XP</p>
            </div>
          )}

          <div className="flex gap-3">
            {phase === 'quiz' ? (
              <button
                type="button"
                disabled={!answer.trim() || submitting}
                onClick={() => void handleSubmit()}
                className="flex-1 rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold px-6 py-3 disabled:opacity-50"
              >
                {submitting ? t.vocabPage.quiz.checking[lang] : t.vocabPage.quiz.submit[lang]}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void goNext()}
                className="flex-1 rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold px-6 py-3"
              >
                {index + 1 >= items.length
                  ? t.vocabPage.session.finish[lang]
                  : t.vocabPage.session.next[lang]}
              </button>
            )}
          </div>

          {promptWord && (
            <Link
              to={`/vocab/learn/${item.wordId}`}
              className="block text-center text-xs text-[#5BC0FF] hover:underline"
            >
              {t.vocabPage.learn.viewDetail[lang]}
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}
