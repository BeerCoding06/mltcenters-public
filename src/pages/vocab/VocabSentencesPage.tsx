import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { PageLoader } from '@/components/PageLoader';
import { getAiSentences } from '@/vocab/api';
import { isVocabOnboarded, useVocabProfile } from '@/vocab/useVocabProfile';
import type { VocabSentence } from '@/vocab/types';

export default function VocabSentencesPage() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const { dashboard, fetchDashboard } = useVocabProfile();
  const [sentences, setSentences] = useState<VocabSentence[]>([]);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVocabOnboarded()) {
      navigate('/vocab/onboarding', { replace: true });
      return;
    }
    void fetchDashboard();
  }, [fetchDashboard, navigate]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAiSentences()
      .then((res) => {
        setSentences(res.sentences);
        setCached(res.cached);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t.vocabPage.sentences.error[lang]),
      )
      .finally(() => setLoading(false));
  }, [lang, t.vocabPage.sentences.error]);

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
        <p className="text-muted-foreground">{error}</p>
        <Link to="/vocab/learn" className="text-[#5BC0FF] hover:underline">
          {t.vocabPage.dashboard.ctaLearn[lang]}
        </Link>
      </div>
    );
  }

  if (!dashboard?.today.sentencesReady && sentences.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
        <h2 className="text-xl font-bold heading-gradient">{t.vocabPage.sentences.emptyTitle[lang]}</h2>
        <p className="text-muted-foreground">{t.vocabPage.sentences.emptyBody[lang]}</p>
        <Link
          to="/vocab/learn"
          className="inline-block rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold px-6 py-3"
        >
          {t.vocabPage.dashboard.ctaLearn[lang]}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold heading-gradient">{t.vocabPage.sentences.title[lang]}</h2>
        <p className="text-sm text-muted-foreground">{t.vocabPage.sentences.subtitle[lang]}</p>
        {cached && (
          <p className="text-xs text-muted-foreground">{t.vocabPage.sentences.cached[lang]}</p>
        )}
      </div>

      <div className="space-y-4">
        {sentences.map((s, i) => (
          <motion.div
            key={`${s.en}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="pastel-card p-6 space-y-2 border-l-4 border-l-[#6EE7B7]"
          >
            <p className="text-foreground leading-relaxed">{s.en}</p>
            <p className="text-sm text-muted-foreground">{s.th}</p>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <Link
          to="/vocab"
          className="inline-block rounded-2xl border border-border bg-white font-medium px-8 py-3 hover:bg-muted"
        >
          {t.vocabPage.session.backDashboard[lang]}
        </Link>
      </div>
    </div>
  );
}
