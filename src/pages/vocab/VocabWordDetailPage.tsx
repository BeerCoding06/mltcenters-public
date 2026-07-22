import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { PageLoader } from '@/components/PageLoader';
import { getWordDetail } from '@/vocab/api';
import { isVocabOnboarded } from '@/vocab/useVocabProfile';
import type { VocabWordDetail } from '@/vocab/types';

export default function VocabWordDetailPage() {
  const { wordId } = useParams<{ wordId: string }>();
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const [word, setWord] = useState<VocabWordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVocabOnboarded()) {
      navigate('/vocab/onboarding', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!wordId) return;
    setLoading(true);
    setError(null);
    getWordDetail(wordId)
      .then(setWord)
      .catch((err) => setError(err instanceof Error ? err.message : t.vocabPage.wordDetail.error[lang]))
      .finally(() => setLoading(false));
  }, [wordId, lang, t.vocabPage.wordDetail.error]);

  if (loading) return <PageLoader />;

  if (error || !word) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
        <p className="text-muted-foreground">{error || t.vocabPage.wordDetail.error[lang]}</p>
        <Link to="/vocab/learn" className="text-[#5BC0FF] hover:underline">
          {t.vocabPage.wordDetail.backLearn[lang]}
        </Link>
      </div>
    );
  }

  const stat = word.stat;

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="pastel-card p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">{word.word}</h2>
          <p className="text-sm text-muted-foreground">{word.ipa}</p>
          <p className="text-xs uppercase tracking-wide text-[#5BC0FF]">{word.pos}</p>
          <p className="text-xl font-medium text-[#5BC0FF]">{word.meaning_th}</p>
        </div>

        <div className="rounded-2xl bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">{t.vocabPage.wordDetail.example[lang]}</p>
          <p className="text-foreground">{word.example_en}</p>
          <p className="text-sm text-muted-foreground">{word.example_th}</p>
        </div>

        {stat && (
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-[#5BC0FF]/10 p-3">
              <p className="text-xs text-muted-foreground">{t.vocabPage.wordDetail.memoryScore[lang]}</p>
              <p className="text-lg font-bold text-[#5BC0FF]">{Math.round(stat.memoryScore)}</p>
            </div>
            <div className="rounded-2xl bg-[#6EE7B7]/20 p-3">
              <p className="text-xs text-muted-foreground">{t.vocabPage.wordDetail.status[lang]}</p>
              <p className="text-lg font-bold capitalize">{stat.status}</p>
            </div>
          </div>
        )}

        <Link
          to="/vocab"
          className="block text-center rounded-2xl border border-border bg-white font-medium px-6 py-3 hover:bg-muted"
        >
          {t.vocabPage.session.backDashboard[lang]}
        </Link>
      </motion.div>
    </div>
  );
}
