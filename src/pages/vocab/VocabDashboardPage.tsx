import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { isVocabOnboarded, needsOnboarding, useVocabProfile } from '@/vocab/useVocabProfile';
import { PageLoader } from '@/components/PageLoader';

export default function VocabDashboardPage() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const { dashboard, loading, error, fetchDashboard } = useVocabProfile();

  useEffect(() => {
    if (!isVocabOnboarded()) {
      navigate('/vocab/onboarding', { replace: true });
      return;
    }

    fetchDashboard().catch(() => {
      navigate('/vocab/onboarding', { replace: true });
    });
  }, [fetchDashboard, navigate]);

  useEffect(() => {
    if (dashboard && needsOnboarding(dashboard, null)) {
      navigate('/vocab/onboarding', { replace: true });
    }
  }, [dashboard, navigate]);

  if (loading && !dashboard) {
    return <PageLoader />;
  }

  if (!dashboard) {
    if (error) {
      return (
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <p className="text-muted-foreground mb-4">{t.vocabPage.dashboard.error[lang]}</p>
          <Link
            to="/vocab/onboarding"
            className="inline-block rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold px-6 py-3"
          >
            {t.vocabPage.onboarding.startButton[lang]}
          </Link>
        </div>
      );
    }
    return <PageLoader />;
  }

  const { streakDays, xp, wordsLearned, accuracy7d, weakWords, strongWords, today, coachTip } =
    dashboard;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold heading-gradient mb-2">
          {t.vocabPage.dashboard.title[lang]}
        </h2>
        <p className="text-muted-foreground text-sm">{t.vocabPage.dashboard.subtitle[lang]}</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t.vocabPage.dashboard.streak[lang], value: `${streakDays} 🔥` },
          { label: t.vocabPage.dashboard.xp[lang], value: `${xp} XP` },
          { label: t.vocabPage.dashboard.wordsLearned[lang], value: String(wordsLearned) },
          { label: t.vocabPage.dashboard.accuracy[lang], value: `${accuracy7d}%` },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="pastel-card p-5 text-center"
          >
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-[#5BC0FF]">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="pastel-card p-6 border-l-4 border-l-[#5BC0FF]"
      >
        <p className="text-sm font-medium text-foreground mb-4">{t.vocabPage.dashboard.todayTitle[lang]}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-muted-foreground">
            {t.vocabPage.dashboard.learnRemaining[lang]}:{' '}
            <span className="font-semibold text-foreground">{today.learnRemaining}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {t.vocabPage.dashboard.reviewDue[lang]}:{' '}
            <span className="font-semibold text-foreground">{today.reviewDue}</span>
          </p>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pastel-card p-6 border border-[#FF8FAB]/30"
        >
          <p className="text-sm font-medium text-foreground mb-3">{t.vocabPage.dashboard.weakTitle[lang]}</p>
          <div className="flex flex-wrap gap-2">
            {weakWords.length ? (
              weakWords.map((w) => (
                <span
                  key={w.id}
                  className="rounded-xl bg-[#FF8FAB]/10 px-3 py-1 text-xs font-medium text-foreground"
                  title={w.meaning_th}
                >
                  {w.word}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t.vocabPage.dashboard.noWeak[lang]}</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="pastel-card p-6 border border-[#6EE7B7]/40"
        >
          <p className="text-sm font-medium text-foreground mb-3">{t.vocabPage.dashboard.strongTitle[lang]}</p>
          <div className="flex flex-wrap gap-2">
            {strongWords.length ? (
              strongWords.map((w) => (
                <span
                  key={w.id}
                  className="rounded-xl bg-[#6EE7B7]/20 px-3 py-1 text-xs font-medium text-foreground"
                  title={w.meaning_th}
                >
                  {w.word}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t.vocabPage.dashboard.noStrong[lang]}</p>
            )}
          </div>
        </motion.div>
      </div>

      {coachTip && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-gradient-to-br from-[#5BC0FF]/15 to-[#6EE7B7]/15 p-5 border border-[#5BC0FF]/25"
        >
          <p className="text-sm font-medium text-foreground mb-1">{t.vocabPage.dashboard.coachTip[lang]}</p>
          <p className="text-sm text-muted-foreground">{coachTip}</p>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
        <Link
          to="/vocab/learn"
          className="text-center rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all"
        >
          {t.vocabPage.dashboard.ctaLearn[lang]}
          {today.learnRemaining > 0 && (
            <span className="ml-2 text-sm opacity-90">({today.learnRemaining})</span>
          )}
        </Link>
        <Link
          to="/vocab/review"
          className="text-center rounded-2xl bg-white border border-border text-foreground font-medium px-8 py-4 shadow hover:bg-muted transition-all"
        >
          {t.vocabPage.dashboard.ctaReview[lang]}
          {today.reviewDue > 0 && <span className="ml-2 text-sm text-muted-foreground">({today.reviewDue})</span>}
        </Link>
        {today.sentencesReady && (
          <Link
            to="/vocab/sentences"
            className="text-center rounded-2xl bg-white border border-[#6EE7B7]/50 text-foreground font-medium px-8 py-4 shadow hover:bg-[#6EE7B7]/10 transition-all"
          >
            {t.vocabPage.dashboard.ctaSentences[lang]}
          </Link>
        )}
      </div>
    </div>
  );
}
