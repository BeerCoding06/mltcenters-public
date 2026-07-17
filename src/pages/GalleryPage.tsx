import { useI18n } from '@/lib/i18n';
import { galleryImages } from '@/lib/gallery-images';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
import { getPaginationRange } from '@/lib/pagination-range';

const PAGE_SIZE = 20;

const GalleryPage = () => {
  const { lang, t } = useI18n();
  const [selected, setSelected] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(galleryImages.length / PAGE_SIZE);

  const pageImages = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return galleryImages.slice(start, start + PAGE_SIZE);
  }, [page]);

  const pageTokens = useMemo(() => getPaginationRange(page, totalPages, 1), [page, totalPages]);

  const pageStartIndex = (page - 1) * PAGE_SIZE;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const pageInfo = t.gallery.pageInfo[lang]
    .replace('{page}', String(page))
    .replace('{total}', String(totalPages));

  return (
    <div className="py-16 min-h-screen">
      <div className="container mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold heading-gradient text-center mb-3"
        >
          {t.gallery.title[lang]}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-center mb-10"
        >
          {t.gallery.sub[lang]}
        </motion.p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
          {pageImages.map((img, i) => (
            <motion.button
              key={img.src}
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.35) }}
              whileHover={{ scale: 1.03 }}
              onClick={() => setSelected(pageStartIndex + i)}
              className="relative aspect-square rounded-2xl overflow-hidden border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <img
                src={img.src}
                alt={lang === 'en' ? img.altEn : img.altTh}
                loading="lazy"
                className="w-full h-full object-cover img-pastel-tone"
              />
              <div className="absolute inset-0 img-pastel-overlay pointer-events-none" aria-hidden />
            </motion.button>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-10 space-y-4">
            <p className="text-center text-sm text-muted-foreground">{pageInfo}</p>
            <Pagination>
              <PaginationContent className="flex-wrap justify-center gap-1">
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    size="default"
                    aria-disabled={page === 1}
                    className={`gap-1 pl-2.5 ${page === 1 ? 'pointer-events-none opacity-40' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{t.gallery.prev[lang]}</span>
                  </PaginationLink>
                </PaginationItem>

                {pageTokens.map((token, index) =>
                  token === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={token}>
                      <PaginationLink
                        href="#"
                        isActive={token === page}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(token);
                        }}
                      >
                        {token}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationLink
                    href="#"
                    size="default"
                    aria-disabled={page === totalPages}
                    className={`gap-1 pr-2.5 ${page === totalPages ? 'pointer-events-none opacity-40' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) setPage(page + 1);
                    }}
                  >
                    <span>{t.gallery.next[lang]}</span>
                    <ChevronRight className="h-4 w-4" />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

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
              className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-xl border border-border/50 bg-card"
            >
              <img
                src={galleryImages[selected].src}
                alt={lang === 'en' ? galleryImages[selected].altEn : galleryImages[selected].altTh}
                className="w-full h-auto max-h-[85vh] object-contain img-pastel-tone"
              />
              <div className="absolute inset-0 img-pastel-overlay pointer-events-none" aria-hidden />
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
