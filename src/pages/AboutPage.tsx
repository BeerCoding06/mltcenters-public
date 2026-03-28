import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { PastelImage } from '@/components/PastelImage';
import aboutWorkshopImg from '@/assets/img01.jpg';

const aboutImgAlt = {
  en: 'Workshop activity: students learning with technology',
  th: 'บรรยากาศกิจกรรมอบรม: นักเรียนเรียนรู้ด้วยเทคโนโลยีสมัยใหม่',
};

const AboutPage = () => {
  const { lang, t } = useI18n();

  return (
    <div className="py-16">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text-pastel mb-6">
            {t.about.title[lang]}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t.about.desc[lang]}
          </p>
        </motion.div>

        {/* Workshop activity image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-16"
        >
          <PastelImage
            src={aboutWorkshopImg}
            alt={aboutImgAlt[lang]}
            overlay
            aspectRatio="video"
            wrapperClassName="hover:scale-[1.02] shadow-xl"
          />
        </motion.div>

        {/* Benefits */}
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12"
        >
          {t.about.benefits.title[lang]}
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {t.about.benefits.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="pastel-card p-7 text-center"
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-foreground mb-2">{item.title[lang]}</h3>
              <p className="text-sm text-muted-foreground">{item.desc[lang]}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
