import { useI18n } from '@/lib/i18n';
import { socialLinks } from '@/lib/social-links';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import lineQrCode from '@/assets/611804.jpg';

const HomeContactSection = () => {
  const { lang, t } = useI18n();

  const channels = [
    {
      icon: Phone,
      label: lang === 'en' ? 'Phone' : 'โทรศัพท์',
      value: t.contactPage.phone,
      href: 'tel:+66948521188',
      color: 'bg-secondary/10 text-secondary',
    },
    {
      icon: Mail,
      label: 'Email',
      value: t.contactPage.email,
      href: `mailto:${t.contactPage.email}`,
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: MapPin,
      label: lang === 'en' ? 'Address' : 'ที่อยู่',
      value: t.contactPage.address[lang],
      href: t.contactPage.mapUrl,
      color: 'bg-accent/10 text-accent',
    },
  ];

  return (
    <section id="contact" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#06C755]/8 via-[#F8FAFC] to-[#5BC0FF]/10" aria-hidden />
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-16 right-[8%] w-72 h-72 rounded-full bg-[#06C755]/10 blur-3xl" />
        <div className="absolute bottom-0 left-[5%] w-80 h-80 rounded-full bg-[#5BC0FF]/15 blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-56 h-56 rounded-full bg-[#6EE7B7]/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06C755]/10 text-[#059669] text-sm font-semibold mb-4">
            <MessageCircle size={16} />
            LINE
          </span>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#5BC0FF] via-[#06C755] to-[#6EE7B7] bg-clip-text text-transparent mb-3">
            {t.homeContact.title[lang]}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t.homeContact.sub[lang]}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 max-w-5xl mx-auto items-center">
          {/* QR card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <div className="relative w-full max-w-[320px]">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#06C755]/30 via-[#5BC0FF]/20 to-[#6EE7B7]/30 blur-sm" aria-hidden />
              <div className="relative rounded-[1.75rem] bg-white/95 backdrop-blur-md border border-white shadow-2xl p-6 sm:p-8 qr-live-glow">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#06C755]">
                    {t.homeContact.lineLive[lang]}
                  </span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06C755] opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#06C755]" />
                  </span>
                </div>

                <div className="relative mx-auto w-[min(100%,240px)] aspect-square rounded-2xl overflow-hidden border-4 border-[#06C755]/20 bg-white p-3 shadow-inner">
                  <img
                    src={lineQrCode}
                    alt={t.homeContact.scanLine[lang]}
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>

                <p className="mt-5 text-center font-semibold text-foreground">{t.homeContact.scanLine[lang]}</p>
                <p className="mt-1 text-center text-sm text-muted-foreground">{t.homeContact.lineHint[lang]}</p>
              </div>
            </div>
          </motion.div>

          {/* Contact channels */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-5"
          >
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t.homeContact.orContact[lang]}
            </p>

            {channels.map(({ icon: Icon, label, value, href, color }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/80 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors break-words">
                    {value}
                  </p>
                </div>
              </a>
            ))}

            <div className="flex flex-wrap gap-2 pt-2">
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

            <div className="flex flex-wrap gap-3 pt-4">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/10 transition-colors"
              >
                {t.homeContact.viewContact[lang]} →
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                {t.homeContact.register[lang]}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HomeContactSection;
