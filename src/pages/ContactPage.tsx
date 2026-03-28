import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';

const ContactPage = () => {
  const { lang, t } = useI18n();

  return (
    <div className="py-16 min-h-screen">
      <div className="container mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold gradient-text-pastel text-center mb-14"
        >
          {t.contactPage.title[lang]}
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="pastel-card p-8 space-y-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-0.5">Email</h3>
                <p className="text-muted-foreground text-sm">{t.contactPage.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-0.5">{lang === 'en' ? 'Phone' : 'โทรศัพท์'}</h3>
                <p className="text-muted-foreground text-sm">{t.contactPage.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-0.5">{lang === 'en' ? 'Address' : 'ที่อยู่'}</h3>
                <p className="text-muted-foreground text-sm">{t.contactPage.address[lang]}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <h3 className="font-semibold text-foreground text-sm mb-3">{t.contactPage.social[lang]}</h3>
              <div className="flex gap-2">
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
          </motion.div>

          {/* Map placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="pastel-card overflow-hidden"
          >
            <div className="w-full h-full min-h-[320px] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-3">📍</div>
                <p className="font-semibold text-foreground">{t.contactPage.mapTitle[lang]}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.contactPage.address[lang]}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
