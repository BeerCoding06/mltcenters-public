import { useI18n } from '@/lib/i18n';
import { socialLinks } from '@/lib/social-links';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Sparkles } from 'lucide-react';
import mltPoster from '@/assets/MLTMEP.png';

const ContactPage = () => {
  const { lang, t } = useI18n();
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(t.contactPage.address.en)}&hl=${lang}&z=16&output=embed`;

  return (
    <div className="py-16 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#5BC0FF]/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full bg-[#6EE7B7]/10 blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full bg-[#FF8FAB]/8 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 max-w-2xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text-pastel mb-4">
            {t.contactPage.title[lang]}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">{t.contactPage.sub[lang]}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 pastel-card p-8 space-y-6 h-fit"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-0.5">Email</h3>
                <a
                  href={`mailto:${t.contactPage.email}`}
                  className="text-muted-foreground text-sm hover:text-primary transition-colors break-all"
                >
                  {t.contactPage.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-0.5">
                  {lang === 'en' ? 'Phone' : 'โทรศัพท์'}
                </h3>
                <a
                  href="tel:+66948521188"
                  className="text-muted-foreground text-sm hover:text-primary transition-colors"
                >
                  {t.contactPage.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-0.5">
                  {lang === 'en' ? 'Address' : 'ที่อยู่'}
                </h3>
                <a
                  href={t.contactPage.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground text-sm hover:text-primary transition-colors"
                >
                  {t.contactPage.address[lang]}
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <h3 className="font-semibold text-foreground text-sm mb-3">{t.contactPage.social[lang]}</h3>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors font-medium"
                  >
                    {link.label[lang]}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Poster + Map */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative"
            >
              <div
                className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#5BC0FF]/25 via-[#6EE7B7]/20 to-[#FFE66D]/15 blur-md"
                aria-hidden
              />
              <div className="relative rounded-[1.75rem] overflow-hidden bg-white/95 backdrop-blur-md border border-white shadow-2xl">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-secondary/5">
                  <Sparkles size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground">{t.contactPage.posterCaption[lang]}</span>
                </div>
                <div className="p-4 sm:p-6 bg-gradient-to-br from-[#F8FAFC] via-white to-[#5BC0FF]/5">
                  <motion.img
                    src={mltPoster}
                    alt={t.contactPage.posterAlt[lang]}
                    className="w-full h-auto max-h-[420px] object-contain mx-auto rounded-xl shadow-lg ring-1 ring-black/5 transition-transform duration-500 hover:scale-[1.02]"
                    whileHover={{ y: -4 }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="pastel-card overflow-hidden flex flex-col"
            >
              <div className="px-5 py-3 border-b border-border/50 bg-muted/20">
                <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  {t.contactPage.mapTitle[lang]}
                </h2>
              </div>
              <div className="relative w-full min-h-[280px] flex-1">
                <iframe
                  title={t.contactPage.mapTitle[lang]}
                  src={mapEmbedUrl}
                  className="absolute inset-0 w-full h-full min-h-[280px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <div className="p-4 border-t border-border/50 bg-muted/30 text-center">
                <a
                  href={t.contactPage.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <MapPin size={16} />
                  {t.contactPage.openInMaps[lang]}
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
