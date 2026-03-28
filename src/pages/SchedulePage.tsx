import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';

const SchedulePage = () => {
  const { lang, t } = useI18n();

  return (
    <div className="py-16 min-h-screen">
      <div className="container mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold gradient-text-pastel text-center mb-14"
        >
          {t.schedule.title[lang]}
        </motion.h1>

        <div className="max-w-2xl mx-auto relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-secondary/40 rounded-full" />

          <div className="space-y-6">
            {t.schedule.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-5"
              >
                {/* Dot */}
                <div className="relative flex-shrink-0 mt-1">
                  <div className="w-[14px] h-[14px] rounded-full bg-secondary border-[3px] border-card shadow-sm z-10 relative" style={{ marginLeft: '10px' }} />
                </div>

                {/* Content */}
                <div className="pastel-card p-5 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-secondary/15 text-secondary">
                      {item.time}
                    </span>
                    <h3 className="font-semibold text-foreground">{item.title[lang]}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.desc[lang]}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
