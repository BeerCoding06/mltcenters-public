import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X } from 'lucide-react';
import img01 from '@/assets/img01.jpg';
import img02 from '@/assets/img02.jpg';
import img03 from '@/assets/img03.jpg';
import img04 from '@/assets/img04.jpg';
import img05 from '@/assets/img05.jpg';
import img06 from '@/assets/img06.jpg';
import img07 from '@/assets/img07.jpg';
import img08 from '@/assets/img08.jpg';
import img09 from '@/assets/img09.jpg';

const galleryImages = [
  { src: img01, altEn: 'Workshop activity', altTh: 'บรรยากาศกิจกรรม' },
  { src: img02, altEn: 'Language learning session', altTh: 'การเรียนภาษา' },
  { src: img03, altEn: 'Team collaboration', altTh: 'ทำงานเป็นทีม' },
  { src: img04, altEn: 'Digital tools in use', altTh: 'ใช้เครื่องมือดิจิทัล' },
  { src: img05, altEn: 'Presentation practice', altTh: 'ฝึกนำเสนอ' },
  { src: img06, altEn: 'Group discussion', altTh: 'อภิปรายกลุ่ม' },
  { src: img07, altEn: 'Hands-on workshop', altTh: 'เวิร์กช็อปเชิงปฏิบัติ' },
  { src: img08, altEn: 'Learning together', altTh: 'เรียนรู้ร่วมกัน' },
  { src: img09, altEn: 'Workshop moment', altTh: 'บรรยากาศในงาน' },
];

const GalleryPage = () => {
  const { lang, t } = useI18n();
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="py-16 min-h-screen">
      <div className="container mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold gradient-text-pastel text-center mb-3"
        >
          {t.gallery.title[lang]}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-center mb-14"
        >
          {t.gallery.sub[lang]}
        </motion.p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {galleryImages.map((img, i) => (
            <motion.button
              key={i}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelected(i)}
              className="aspect-square rounded-2xl overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <img
                src={img.src}
                alt={lang === 'en' ? img.altEn : img.altTh}
                className="w-full h-full object-cover img-pastel-tone"
              />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-xl border border-border/50 bg-card"
            >
              <img
                src={galleryImages[selected].src}
                alt={lang === 'en' ? galleryImages[selected].altEn : galleryImages[selected].altTh}
                className="w-full h-auto max-h-[85vh] object-contain img-pastel-tone"
              />
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/90 backdrop-blur flex items-center justify-center shadow-lg text-foreground hover:bg-card transition-colors"
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

export default GalleryPage;
