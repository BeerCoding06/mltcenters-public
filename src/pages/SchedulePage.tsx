import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Globe, Hotel, MapPin, Clock } from 'lucide-react';

const SchedulePage = () => {
  const { lang, t } = useI18n();
  const { travel, hotel } = t.schedule;

  return (
    <div className="py-16 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#5BC0FF]/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-[#FFE66D]/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14 max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text-pastel mb-4">
            {t.schedule.title[lang]}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">{t.schedule.sub[lang]}</p>
        </motion.div>

        {/* International Tours */}
        <section className="max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Globe size={22} className="text-primary" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {travel.badge[lang]}
              </span>
              <h2 className="text-2xl font-bold text-foreground">{travel.badge[lang]}</h2>
            </div>
          </motion.div>
          <p className="text-muted-foreground mb-8 ml-0 sm:ml-14">{travel.intro[lang]}</p>

          <div className="space-y-4 mb-10">
            {travel.programs.map((program, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="pastel-card p-6 border-l-4 border-l-primary hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                    <Calendar size={13} />
                    {program.period[lang]}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin size={13} />
                    {program.destination[lang]}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{program.title[lang]}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{program.desc[lang]}</p>
              </motion.div>
            ))}
          </div>

          <div className="pastel-card p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              {travel.tripOutline.title[lang]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {travel.tripOutline.days.map((day, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-md bg-white/80 text-primary border border-primary/20">
                    {day.label[lang]}
                  </span>
                  <p className="text-sm text-muted-foreground">{day.desc[lang]}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hotel Workshop */}
        <section className="max-w-4xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FFE66D]/25 flex items-center justify-center">
              <Hotel size={22} className="text-[#B8860B]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B8860B]">
                {hotel.badge[lang]}
              </span>
              <h2 className="text-2xl font-bold text-foreground">{hotel.badge[lang]}</h2>
            </div>
          </motion.div>
          <p className="text-muted-foreground mb-4 ml-0 sm:ml-14">{hotel.intro[lang]}</p>
          <div className="ml-0 sm:ml-14 flex flex-wrap gap-3 mb-8">
            <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-secondary/10 text-secondary font-medium">
              <Clock size={14} />
              {hotel.recurring[lang]}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-muted text-muted-foreground">
              <MapPin size={14} />
              {hotel.venue[lang]}
            </span>
          </div>

          <div className="space-y-4 mb-10">
            {hotel.sessions.map((session, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="pastel-card p-6 border-l-4 border-l-[#FFE66D] hover:shadow-lg transition-shadow"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-[#FFE66D]/20 text-[#92680a] mb-3">
                  <Calendar size={13} />
                  {session.period[lang]}
                </span>
                <h3 className="font-bold text-foreground text-lg mb-2">{session.title[lang]}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{session.desc[lang]}</p>
              </motion.div>
            ))}
          </div>

          <h3 className="font-semibold text-foreground mb-5 ml-1">
            {lang === 'en' ? 'Typical workshop day' : 'ตัวอย่างกำหนดการ 1 วัน'}
          </h3>
          <div className="relative max-w-2xl">
            <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-[#FFE66D]/50 rounded-full" />
            <div className="space-y-5">
              {hotel.dayPlan.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-5"
                >
                  <div className="relative flex-shrink-0 mt-1">
                    <div
                      className="w-[14px] h-[14px] rounded-full bg-[#FFE66D] border-[3px] border-card shadow-sm z-10 relative"
                      style={{ marginLeft: '10px' }}
                    />
                  </div>
                  <div className="pastel-card p-5 flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#FFE66D]/20 text-[#92680a]">
                        {item.time}
                      </span>
                      <h4 className="font-semibold text-foreground">{item.title[lang]}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.desc[lang]}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer note + CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center pastel-card p-8"
        >
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{t.schedule.note[lang]}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register" className="gradient-btn px-6 py-3 text-sm font-semibold">
              {t.schedule.ctaRegister[lang]}
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 text-sm font-semibold rounded-2xl border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
            >
              {t.schedule.ctaContact[lang]}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SchedulePage;
