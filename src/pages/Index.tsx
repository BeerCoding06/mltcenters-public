import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useParallax } from '@/hooks/useParallax';
import { galleryPreviewImages } from '@/lib/gallery-preview';
import { getGalleryImage } from '@/lib/gallery-images';
import { Reveal } from '@/components/Reveal';
import { HOME_FAQ } from '@/constants/seo-content';

const HomeContactSection = lazy(() => import('@/components/HomeContactSection'));

const HERO_BANNER = "/hero-banner.webp";
const HERO_BANNER_FALLBACK = "/hero-banner.jpg";
const KRUMAM_CLUB_BANNER = "/assets/img-design-about/krumamclub.jpg";

// Gallery picks aligned with aboutValue topics (album file: 38, 64, 50)
const aboutValueImages = [
  getGalleryImage(36),
  getGalleryImage(62),
  getGalleryImage(48),
];

const galleryImages = galleryPreviewImages;

const HomePage = () => {
  const { lang, t } = useI18n();
  const parallax = useParallax(700);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 1) HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden py-20" aria-label="Hero">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#5BC0FF]/20 via-[#6EE7B7]/15 to-[#FFE66D]/10 md:transition-transform md:duration-100 md:will-change-transform"
          style={{ transform: `translate3d(0, ${parallax.bg}px, 0)` }}
        />
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block transition-transform duration-100 will-change-transform"
          style={{ transform: `translate3d(0, ${parallax.blobs}px, 0)` }}
        >
          <div className="absolute top-[15%] left-[8%] w-40 h-40 rounded-full bg-[#5BC0FF]/30 blur-3xl animate-hero-float" />
          <div className="absolute top-[35%] right-[12%] w-48 h-48 rounded-full bg-[#6EE7B7]/25 blur-3xl animate-hero-float-delay" />
          <div className="absolute bottom-[20%] left-[35%] w-36 h-36 rounded-full bg-[#FF8FAB]/20 blur-3xl animate-hero-float-slow" />
        </div>

        <div className="relative z-10 container mx-auto px-6 flex flex-col md:flex-row items-center md:items-stretch gap-8 md:gap-12 min-h-[80vh]">
          <div className="flex-1 order-2 md:order-1 max-w-xl w-full text-center md:text-left flex">
            <div className="w-full max-md:opacity-100 animate-hero-fade-in bg-white/90 md:bg-white/70 md:backdrop-blur-md rounded-2xl shadow-xl px-8 py-10 sm:px-10 sm:py-12 border border-white/50 md:h-full md:flex md:flex-col md:justify-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold md:!leading-[1.3] mb-6 heading-gradient">
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
            </div>
          </div>

          <div
            className="flex-1 order-1 md:order-2 flex max-md:opacity-100 animate-hero-fade-in-delay md:transition-transform md:duration-100 md:will-change-transform"
            style={{ transform: `translate3d(0, ${parallax.image}px, 0)` }}
          >
            <div className="flex flex-col gap-3 sm:gap-4 w-full h-full min-h-0">
              <div className="relative rounded-2xl shadow-xl overflow-hidden aspect-[1706/651] md:aspect-auto md:flex-[651] md:min-h-0 group">
                <img
                  src={KRUMAM_CLUB_BANNER}
                  alt={t.imageAlt.krumamClubBanner[lang]}
                  width={1706}
                  height={651}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full md:absolute md:inset-0 object-cover object-center img-design-style group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 img-pastel-overlay pointer-events-none" aria-hidden />
              </div>
              <div className="relative rounded-2xl shadow-xl overflow-hidden aspect-[4/3] md:aspect-auto md:flex-[800] md:min-h-0 group">
                <picture className="block w-full h-full md:absolute md:inset-0">
                  <source srcSet="/hero-banner-mobile.webp" type="image/webp" media="(max-width: 767px)" />
                  <source srcSet="/hero-banner.webp" type="image/webp" />
                  <source srcSet="/hero-banner-mobile.jpg" media="(max-width: 767px)" />
                  <img
                    src={HERO_BANNER_FALLBACK}
                    alt={t.imageAlt.hero[lang]}
                    width={1400}
                    height={1050}
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover object-center img-design-style group-hover:scale-105 transition-transform duration-500"
                  />
                </picture>
                <div className="absolute inset-0 img-pastel-overlay pointer-events-none" aria-hidden />
              </div>
            </div>
          </div>
        </div>

        <a
          href="#about-value"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-muted-foreground hover:text-foreground transition-colors animate-hero-scroll"
          aria-label={lang === 'en' ? 'Scroll' : 'เลื่อนดู'}
        >
          <ChevronDown className="w-8 h-8 animate-scroll-bounce" strokeWidth={2.5} />
        </a>
      </section>

      <div>
        {/* 2) ทำไมต้องเวิร์กช็อปนี้ */}
        <section id="about-value" className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5BC0FF]/15 via-[#6EE7B7]/10 to-[#FFE66D]/10" aria-hidden />
          <div className="absolute inset-0 opacity-[0.07] bg-gradient-to-br from-[#5BC0FF]/30 via-[#6EE7B7]/20 to-[#FFE66D]/20" aria-hidden />
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#5BC0FF]/20 blur-3xl" />
            <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-[#6EE7B7]/15 blur-3xl" />
            <div className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full bg-[#FF8FAB]/10 blur-3xl" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 heading-gradient">
                {t.aboutValue.title[lang]}
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-center text-muted-foreground max-w-xl mx-auto mb-14">
                {t.aboutValue.sub[lang]}
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {t.aboutValue.items.map((item, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div className="group rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-[#5BC0FF]/15 border border-white/80 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={aboutValueImages[i].src}
                        alt={item.alt[lang]}
                        loading="lazy"
                        decoding="async"
                        width={800}
                        height={600}
                        className="w-full h-full object-cover object-center img-design-style group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 img-pastel-overlay pointer-events-none" aria-hidden />
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" aria-hidden />
                    </div>
                    <div className="p-6 lg:p-7">
                      <h3 className="text-xl font-bold text-foreground mb-3">{item.title[lang]}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc[lang]}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 3) บรรยากาศในงาน */}
        <section className="py-20 bg-[#F8FAFC]">
          <div className="container mx-auto px-6">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
                {t.galleryPreview.title[lang]}
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <div className="text-center mb-12">
                <Link to="/gallery" className="text-[#5BC0FF] font-semibold hover:underline">
                  {t.galleryPreview.viewAll[lang]} →
                </Link>
              </div>
            </Reveal>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {galleryImages.map((img, i) => (
                <Reveal key={i} delay={i * 40}>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="w-full aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#5BC0FF]/50 group"
                  >
                    <div className="relative w-full h-full">
                      <img
                        src={img.src}
                        alt={lang === 'en' ? img.altEn : img.altTh}
                        loading="lazy"
                        decoding="async"
                        width={400}
                        height={400}
                        className="w-full h-full object-cover img-pastel-tone group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 img-pastel-overlay pointer-events-none" aria-hidden />
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 5) BENEFITS */}
        <section className="py-20 gradient-bg-hero">
          <div className="container mx-auto px-6">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-14">
                {t.benefits.title[lang]}
              </h2>
            </Reveal>

            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {t.benefits.items.map((item, i) => (
                <Reveal key={i} delay={i * 60}>
                  <div className="rounded-2xl px-6 py-4 bg-white/90 shadow-lg border border-white/80 font-medium text-foreground">
                    {item[lang]}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-white" aria-labelledby="home-faq-heading">
          <div className="container mx-auto px-6 max-w-3xl">
            <h2 id="home-faq-heading" className="text-3xl md:text-4xl font-bold text-center text-foreground mb-10">
              {lang === 'th' ? 'คำถามที่พบบ่อย' : 'Frequently Asked Questions'}
            </h2>
            <dl className="space-y-6">
              {HOME_FAQ[lang].map((item) => (
                <div key={item.question} className="rounded-2xl border border-border/60 bg-[#F8FAFC] p-5">
                  <dt className="font-semibold text-foreground mb-2">{item.question}</dt>
                  <dd className="text-muted-foreground text-sm leading-relaxed">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <Suspense fallback={null}>
          <HomeContactSection />
        </Suspense>

        {/* 6) BIG CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="emotional-cta-bg absolute inset-0" aria-hidden />
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-[10%] w-48 h-48 rounded-full bg-[#5BC0FF]/20 blur-3xl" />
            <div className="absolute bottom-1/4 right-[15%] w-56 h-56 rounded-full bg-[#6EE7B7]/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-[#FF8FAB]/15 blur-3xl" />
          </div>

          <div className="container mx-auto px-6 relative z-10 text-center">
            <Reveal>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-10 underline-animated inline-block">
                {t.finalCta.heading[lang]}
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <Link
                to="/register"
                className="inline-block bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-bold rounded-2xl px-14 py-5 text-xl shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 animate-btn-bounce focus:outline-none focus:ring-2 focus:ring-[#5BC0FF]/50"
              >
                {t.finalCta.btn[lang]}
              </Link>
            </Reveal>
          </div>
        </section>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'en' ? 'Image preview' : 'ดูรูปภาพ'}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl bg-white animate-in zoom-in-95 duration-200"
          >
            <div className="relative">
              <img
                src={galleryImages[lightboxIndex].src}
                alt={lang === 'en' ? galleryImages[lightboxIndex].altEn : galleryImages[lightboxIndex].altTh}
                width={1200}
                height={1200}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
