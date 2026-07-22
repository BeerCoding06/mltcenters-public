import { Outlet } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';

export default function VocabLayout() {
  const { lang, t } = useI18n();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] pb-12">
      <div className="border-b border-border/60 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-wide text-[#5BC0FF]">
            {t.vocabPage.layout.badge[lang]}
          </p>
          <h1 className="text-xl md:text-2xl font-bold heading-gradient">{t.vocabPage.layout.title[lang]}</h1>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
