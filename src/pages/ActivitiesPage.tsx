import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { PastelImage } from '@/components/PastelImage';
import { getGalleryImage } from '@/lib/gallery-images';

const activityImages = [
  getGalleryImage(12).src,
  getGalleryImage(38).src,
  getGalleryImage(64).src,
  getGalleryImage(90).src,
];

const activityImgAlts: Record<string, { en: string; th: string }> = {
  0: { en: 'AI conversation practice', th: 'ฝึกสนทนาด้วย AI' },
  1: { en: 'Language apps workshop', th: 'ฝึกใช้แอปเรียนภาษา' },
  2: { en: 'Team language games', th: 'เกมภาษาแบบทีม' },
  3: { en: 'Digital presentation skills', th: 'พรีเซนต์ด้วยเทคโนโลยี' },
};

const colorMap: Record<string, string> = {
  primary: 'border-l-primary bg-primary/5',
  secondary: 'border-l-secondary bg-secondary/5',
  accent: 'border-l-accent bg-accent/5',
  highlight: 'border-l-highlight bg-highlight/5',
};

const ActivitiesPage = () => {
  const { lang, t } = useI18n();

  return (
    <div className="py-16 gradient-bg-hero min-h-screen">
      <div className="container mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold heading-gradient text-center mb-14"
        >
          {t.activities.title[lang]}
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {t.activities.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className={`pastel-card overflow-hidden p-0 border-l-4 ${colorMap[item.color]} cursor-default`}
            >
              <div className="rounded-t-2xl overflow-hidden">
                <PastelImage
                  src={activityImages[i]}
                  alt={activityImgAlts[i]?.[lang] ?? item.title[lang]}
                  overlay
                  aspectRatio="video"
                  wrapperClassName="rounded-t-2xl rounded-b-none shadow-none hover:scale-105 hover:shadow-lg"
                />
              </div>
              <div className="p-8">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-foreground mb-3">{item.title[lang]}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{item.desc[lang]}</p>
                {i === 2 ? (
                  <a
                    href="/runner-app/"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {lang === 'th' ? 'เล่นเกมเลย →' : 'Play now →'}
                  </a>
                ) : (
                <button className="text-sm font-semibold text-primary hover:underline">
                  {t.activities.learnMore[lang]} →
                </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivitiesPage;
