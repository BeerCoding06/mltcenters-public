import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { useParallax } from '@/hooks/useParallax';

// Hero, About, Activities: src/assets/img-design
import heroImg from '@/assets/img-design/imgdd.png';
import aboutImg1 from '@/assets/img-design/5545.png';
import aboutImg2 from '@/assets/img-design/5546.png';
import aboutImg3 from '@/assets/img-design/esrwtsry.png';
// Gallery: รูปจาก src/assets/ ปรับโทนสีให้เข้ากับหน้าเว็บ (pastel)
import gal1 from '@/assets/img01.jpg';
import gal2 from '@/assets/img02.jpg';
import gal3 from '@/assets/img03.jpg';
import gal4 from '@/assets/img04.jpg';
import gal5 from '@/assets/img05.jpg';
import gal6 from '@/assets/img06.jpg';
import gal7 from '@/assets/img07.jpg';
import gal8 from '@/assets/img08.jpg';

const heroAlt = {
  en: 'Learn languages through technology',
  th: 'เรียนภาษาผ่านเทคโนโลยี',
};

const aboutImages = [aboutImg1, aboutImg2, aboutImg3];

const galleryImages = [
  { src: gal1, altEn: 'Workshop activity', altTh: 'บรรยากาศกิจกรรม' },
  { src: gal2, altEn: 'Learning session', altTh: 'การเรียนในห้อง' },
  { src: gal3, altEn: 'Team work', altTh: 'ทำงานเป็นทีม' },
  { src: gal4, altEn: 'Hands-on', altTh: 'ลงมือปฏิบัติ' },
  { src: gal5, altEn: 'Presentation', altTh: 'นำเสนอ' },
  { src: gal6, altEn: 'Discussion', altTh: 'อภิปราย' },
  { src: gal7, altEn: 'Workshop moment', altTh: 'บรรยากาศในงาน' },
  { src: gal8, altEn: 'Group activity', altTh: 'กิจกรรมกลุ่ม' },
];

const HomePage = () => {
  const { lang, t } = useI18n();
  const parallax = useParallax(700);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 1) HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden py-20" aria-label="Hero">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#5BC0FF]/20 via-[#6EE7B7]/15 to-[#FFE66D]/10 transition-transform duration-100 will-change-transform"
          style={{ transform: `translate3d(0, ${parallax.bg}px, 0)` }}
        />
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden transition-transform duration-100 will-change-transform"
          style={{ transform: `translate3d(0, ${parallax.blobs}px, 0)` }}
        >
          <div className="absolute top-[15%] left-[8%] w-40 h-40 rounded-full bg-[#5BC0FF]/30 blur-3xl animate-hero-float" />
          <div className="absolute top-[35%] right-[12%] w-48 h-48 rounded-full bg-[#6EE7B7]/25 blur-3xl animate-hero-float-delay" />
          <div className="absolute bottom-[20%] left-[35%] w-36 h-36 rounded-full bg-[#FF8FAB]/20 blur-3xl animate-hero-float-slow" />
        </div>

        <div className="relative z-10 container mx-auto px-6 flex flex-col md:flex-row items-center gap-8 md:gap-12 min-h-[80vh]">
          <div className="flex-1 order-2 md:order-1 max-w-xl text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl px-8 py-10 sm:px-10 sm:py-12 border border-white/50"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-[#5BC0FF] via-[#6EE7B7] to-[#5BC0FF] bg-clip-text text-transparent">
                {t.hero.headline[lang]}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
                {t.hero.sub[lang]}
              </p>
              <Link
                to="/register"
                className="inline-block bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold rounded-2xl px-10 py-4 text-lg shadow-xl hover:scale-105 hover:shadow-2xl hover:shadow-[#5BC0FF]/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5BC0FF]/50"
              >
                {t.hero.cta[lang]}
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex-1 order-1 md:order-2 w-full max-w-lg mx-auto md:max-w-xl transition-transform duration-100 will-change-transform"
            style={{ transform: `translate3d(0, ${parallax.image}px, 0)` }}
          >
            <div className="relative rounded-2xl shadow-xl overflow-hidden aspect-[4/3] md:aspect-[5/4] group">
              <img
                src={heroImg}
                alt={heroAlt[lang]}
                className="w-full h-full object-cover object-center img-design-style group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 img-pastel-overlay pointer-events-none" aria-hidden />
            </div>
          </motion.div>
        </div>

        <motion.a
          href="#about-value"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={lang === 'en' ? 'Scroll' : 'เลื่อนดู'}
        >
          <ChevronDown className="w-8 h-8 animate-scroll-bounce" strokeWidth={2.5} />
        </motion.a>
      </section>

      <main>
        {/* 2) ทำไมต้องเวิร์กช็อปนี้ – พื้นหลังสวย + การ์ดรูปจาก img-design */}
        <section id="about-value" className="relative py-20 overflow-hidden">
          {/* พื้นหลัง: gradient + ภาพโปร่ง + blob */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#5BC0FF]/15 via-[#6EE7B7]/10 to-[#FFE66D]/10" aria-hidden />
          <div className="absolute inset-0 opacity-[0.07]">
            <img
              src={heroImg}
              alt=""
              className="w-full h-full object-cover object-center scale-105"
              aria-hidden
            />
          </div>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#5BC0FF]/20 blur-3xl" />
            <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-[#6EE7B7]/15 blur-3xl" />
            <div className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full bg-[#FF8FAB]/10 blur-3xl" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-[#5BC0FF] via-[#6EE7B7] to-[#5BC0FF] bg-clip-text text-transparent"
            >
              {t.aboutValue.title[lang]}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center text-muted-foreground max-w-xl mx-auto mb-14"
            >
              {t.aboutValue.sub[lang]}
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {t.aboutValue.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-[#5BC0FF]/15 border border-white/80 overflow-hidden transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={aboutImages[i]}
                      alt={item.title[lang]}
                      loading="lazy"
                      className="w-full h-full object-cover object-center img-design-style group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 img-pastel-overlay pointer-events-none" aria-hidden />
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" aria-hidden />
                  </div>
                  <div className="p-6 lg:p-7">
                    <h3 className="text-xl font-bold text-foreground mb-3">{item.title[lang]}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc[lang]}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 3) บรรยากาศในงาน – รูปจาก src/assets/ ปรับโทนให้เข้ากับหน้าเว็บ */}
        <section className="py-20 bg-[#F8FAFC]">
          <div className="container mx-auto px-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4"
            >
              {t.galleryPreview.title[lang]}
            </motion.h2>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
              <Link to="/gallery" className="text-[#5BC0FF] font-semibold hover:underline">
                {t.galleryPreview.viewAll[lang]} →
              </Link>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {galleryImages.map((img, i) => (
                <motion.button
                  key={i}
                  type="button"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setLightboxIndex(i)}
                  className="aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5BC0FF]/50 group"
                >
                  <div className="relative w-full h-full">
                    <img
                      src={img.src}
                      alt={lang === 'en' ? img.altEn : img.altTh}
                      loading="lazy"
                      className="w-full h-full object-cover img-pastel-tone group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 img-pastel-overlay pointer-events-none" aria-hidden />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* 5) BENEFITS */}
        <section className="py-20 gradient-bg-hero">
          <div className="container mx-auto px-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-center text-foreground mb-14"
            >
              {t.benefits.title[lang]}
            </motion.h2>

            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {t.benefits.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl px-6 py-4 bg-white/90 shadow-lg border border-white/80 font-medium text-foreground"
                >
                  {item[lang]}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 6) BIG CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="emotional-cta-bg absolute inset-0" aria-hidden />
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-[10%] w-48 h-48 rounded-full bg-[#5BC0FF]/20 blur-3xl" />
            <div className="absolute bottom-1/4 right-[15%] w-56 h-56 rounded-full bg-[#6EE7B7]/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-[#FF8FAB]/15 blur-3xl" />
          </div>

          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-10 underline-animated inline-block"
            >
              {t.finalCta.heading[lang]}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Link
                to="/register"
                className="inline-block bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-bold rounded-2xl px-14 py-5 text-xl shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 animate-btn-bounce focus:outline-none focus:ring-2 focus:ring-[#5BC0FF]/50"
              >
                {t.finalCta.btn[lang]}
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl bg-white"
            >
              <div className="relative">
                <img
                  src={galleryImages[lightboxIndex].src}
                  alt={lang === 'en' ? galleryImages[lightboxIndex].altEn : galleryImages[lightboxIndex].altTh}
                  className="w-full h-auto max-h-[85vh] object-contain img-pastel-tone"
                />
                <div className="absolute inset-0 img-pastel-overlay pointer-events-none rounded-2xl" aria-hidden />
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center text-foreground hover:bg-white"
                aria-label={lang === 'en' ? 'Close' : 'ปิด'}
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
