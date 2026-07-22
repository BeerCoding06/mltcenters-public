import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { PageLoader } from '@/components/PageLoader';
import { isVocabOnboarded, useVocabProfile } from '@/vocab/useVocabProfile';
import { VocabSessionFlow } from './VocabSessionFlow';

export default function VocabReviewPage() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const { dashboard, loading, error, fetchDashboard } = useVocabProfile();

  useEffect(() => {
    if (!isVocabOnboarded()) {
      navigate('/vocab/onboarding', { replace: true });
      return;
    }
    void fetchDashboard();
  }, [fetchDashboard, navigate]);

  if (loading && !dashboard) return <PageLoader />;

  if (!dashboard) {
    if (error) {
      return (
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <p className="text-muted-foreground mb-4">{t.vocabPage.dashboard.error[lang]}</p>
          <Link to="/vocab" className="text-[#5BC0FF] hover:underline">
            {t.vocabPage.session.backDashboard[lang]}
          </Link>
        </div>
      );
    }
    return <PageLoader />;
  }

  if (dashboard.today.reviewDue <= 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
        <h2 className="text-xl font-bold heading-gradient">{t.vocabPage.review.emptyTitle[lang]}</h2>
        <p className="text-muted-foreground">{t.vocabPage.review.emptyBody[lang]}</p>
        <Link
          to="/vocab/learn"
          className="inline-block rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold px-6 py-3"
        >
          {t.vocabPage.dashboard.ctaLearn[lang]}
        </Link>
      </div>
    );
  }

  return <VocabSessionFlow mode="review" showCard={false} />;
}
