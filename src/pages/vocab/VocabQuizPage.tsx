import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { isVocabOnboarded } from '@/vocab/useVocabProfile';
import { VocabSessionFlow } from './VocabSessionFlow';

export default function VocabQuizPage() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isVocabOnboarded()) {
      navigate('/vocab/onboarding', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="space-y-4">
      <div className="container mx-auto px-4 pt-6 max-w-lg">
        <p className="text-sm text-muted-foreground text-center">{t.vocabPage.quiz.subtitle[lang]}</p>
      </div>
      <VocabSessionFlow mode="quiz" showCard={false} />
    </div>
  );
}
