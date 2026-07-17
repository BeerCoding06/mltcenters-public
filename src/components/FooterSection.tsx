import { useI18n } from '@/lib/i18n';
import { socialLinks } from '@/lib/social-links';
import { Mail, Phone, MapPin } from 'lucide-react';

const BRAND_LOGO = '/logo-nav.png';

const FooterSection = () => {
  const { lang, t } = useI18n();

  return (
    <footer className="bg-card border-t border-border/50 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center bg-[#29303d] rounded-[5px] shrink-0">
              <img src={BRAND_LOGO} alt={t.imageAlt.brandLogo[lang]} width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-foreground">MLT<span className="text-[#0f4c6a]">CENTERS</span></span>
              <p className="text-xs text-muted-foreground">{t.footer.tagline[lang]}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <a href={`mailto:${t.contactPage.email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
              <Mail size={14} className="text-[#0f4c6a] shrink-0" aria-hidden />
              {t.contactPage.email}
            </a>
            <a href="tel:+66948521188" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone size={14} className="text-secondary shrink-0" />
              {t.contactPage.phone}
            </a>
            <a
              href={t.contactPage.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 hover:text-primary transition-colors"
            >
              <MapPin size={14} className="text-accent shrink-0 mt-0.5" />
              <span>{t.contactPage.address[lang]}</span>
            </a>
          </div>

          <div className="flex gap-3 flex-wrap">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                {link.label[lang]}
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
