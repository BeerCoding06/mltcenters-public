import { useI18n } from '@/lib/i18n';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const FooterSection = () => {
  const { lang, t } = useI18n();

  return (
    <footer className="bg-card border-t border-border/50 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-btn flex items-center justify-center text-sm">🌐</div>
            <div>
              <span className="font-bold text-foreground">Lang<span className="text-primary">Tech</span></span>
              <p className="text-xs text-muted-foreground">{t.footer.tagline[lang]}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {['Facebook', 'Instagram', 'YouTube', 'Line'].map((s) => (
              <a
                key={s}
                href="#"
                className="px-3 py-1.5 text-xs rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
          {t.footer.rights[lang]}
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
