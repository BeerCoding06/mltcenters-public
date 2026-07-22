import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { isVocabOnboarded, useVocabProfile } from '@/vocab/useVocabProfile';
import type { VocabGoal } from '@/vocab/types';

const GOALS: VocabGoal[] = ['general', 'toeic', 'travel', 'business'];

export default function VocabOnboardingPage() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const { saveProfile, loading, error } = useVocabProfile();
  const [selectedGoal, setSelectedGoal] = useState<VocabGoal>('general');

  useEffect(() => {
    if (isVocabOnboarded()) {
      navigate('/vocab', { replace: true });
    }
  }, [navigate]);

  const handleStart = async () => {
    try {
      await saveProfile(selectedGoal, 'starter');
      navigate('/vocab', { replace: true });
    } catch {
      /* error surfaced in UI */
    }
  };

  const goalLabel = (goal: VocabGoal) => t.vocabPage.onboarding.goals[goal][lang];

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="pastel-card p-8 space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold heading-gradient">{t.vocabPage.onboarding.title[lang]}</h2>
          <p className="text-sm text-muted-foreground">{t.vocabPage.onboarding.subtitle[lang]}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{t.vocabPage.onboarding.goalLabel[lang]}</p>
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map((goal) => {
              const active = selectedGoal === goal;
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setSelectedGoal(goal)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? 'border-[#5BC0FF] bg-gradient-to-br from-[#5BC0FF]/15 to-[#6EE7B7]/15 text-foreground shadow-sm'
                      : 'border-border bg-white hover:border-[#5BC0FF]/40'
                  }`}
                >
                  {goalLabel(goal)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#6EE7B7]/40 bg-gradient-to-r from-[#5BC0FF]/10 to-[#6EE7B7]/10 p-4">
          <p className="text-sm font-medium text-foreground mb-1">
            {t.vocabPage.onboarding.levelLabel[lang]}
          </p>
          <p className="text-base font-semibold text-[#5BC0FF]">
            {t.vocabPage.onboarding.levelStarter[lang]}
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold px-6 py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
        >
          {loading ? t.vocabPage.onboarding.saving[lang] : t.vocabPage.onboarding.startButton[lang]}
        </button>
      </motion.div>
    </div>
  );
}
