import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Play } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Reveal } from '@/components/Reveal';
import { ProgramEbookModal } from '@/components/ProgramEbookModal';
import { ProgramVideoModal } from '@/components/ProgramVideoModal';
import { getProgramVideoSource, PROGRAM_VIDEO_POSTER } from '@/constants/program-video';
import { ANALYTICS_EVENTS } from '@/analytics/analytics-context';
import { track } from '@/analytics/track';

type Props = {
  variant?: 'standalone' | 'embedded';
};

export function ProgramVideoSection({ variant = 'embedded' }: Props) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [ebookOpen, setEbookOpen] = useState(false);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const ebookBtnRef = useRef<HTMLButtonElement>(null);
  const source = getProgramVideoSource();
  const pv = t.programVideo;

  const handlePlay = () => {
    track(ANALYTICS_EVENTS.PROGRAM_VIDEO_PLAY_CLICK, { source: 'home' });
    setOpen(true);
  };

  const handleClose = (method: 'button' | 'escape' | 'backdrop') => {
    track(ANALYTICS_EVENTS.PROGRAM_VIDEO_MODAL_CLOSE, { method });
    setOpen(false);
  };

  const handleEbookOpen = () => {
    track(ANALYTICS_EVENTS.PROGRAM_EBOOK_OPEN);
    setEbookOpen(true);
  };

  const handleEbookClose = (method: 'button' | 'escape' | 'backdrop') => {
    track(ANALYTICS_EVENTS.PROGRAM_EBOOK_MODAL_CLOSE, { method });
    setEbookOpen(false);
  };

  const videoBlock = (
    <Reveal delay={240}>
      <div className="mx-auto mt-10 max-w-4xl sm:mt-12">
        <button
          ref={playBtnRef}
          type="button"
          onClick={handlePlay}
          className="group relative block w-full overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#5BC0FF]/50 touch-manipulation"
          aria-label={pv.playLabel[lang]}
        >
          <span className="relative block aspect-video w-full">
            <img
              src={PROGRAM_VIDEO_POSTER}
              alt={pv.posterAlt[lang]}
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover img-pastel-tone"
            />
            <span className="pointer-events-none absolute inset-0 img-pastel-overlay" aria-hidden />
            <span
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10"
              aria-hidden
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white shadow-xl transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
                <Play className="ml-1 h-8 w-8 fill-current sm:h-9 sm:w-9" aria-hidden />
              </span>
            </span>
          </span>
        </button>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 px-2 sm:flex-row sm:items-center sm:px-0">
          <Link
            to="/register"
            onClick={() => track(ANALYTICS_EVENTS.PROGRAM_VIDEO_REGISTER_CLICK)}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] px-10 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#5BC0FF]/30 focus:outline-none focus:ring-2 focus:ring-[#5BC0FF]/50 touch-manipulation"
          >
            {pv.cta[lang]}
          </Link>
          <button
            ref={ebookBtnRef}
            type="button"
            onClick={handleEbookOpen}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-8 py-4 text-lg font-semibold text-foreground shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#5BC0FF]/40 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#5BC0FF]/50 touch-manipulation"
          >
            <BookOpen className="h-5 w-5 shrink-0 text-[#5BC0FF]" aria-hidden />
            {pv.ebook[lang]}
          </button>
        </div>
      </div>
    </Reveal>
  );

  const modal = (
    <>
      <ProgramVideoModal
        open={open}
        source={open ? source : null}
        onClose={handleClose}
        closeLabel={pv.closeLabel[lang]}
        unavailableLabel={pv.unavailable[lang]}
        returnFocusRef={playBtnRef}
      />
      <ProgramEbookModal
        open={ebookOpen}
        onClose={handleEbookClose}
        title={pv.ebookTitle[lang]}
        closeLabel={pv.ebookClose[lang]}
        downloadLabel={pv.ebookDownload[lang]}
        returnFocusRef={ebookBtnRef}
        onDownload={() => track(ANALYTICS_EVENTS.PROGRAM_EBOOK_DOWNLOAD)}
      />
    </>
  );

  if (variant === 'embedded') {
    return (
      <>
        {videoBlock}
        {modal}
      </>
    );
  }

  return (
    <>
      <section
        id="program-video"
        className="relative overflow-hidden py-20"
        aria-labelledby="program-video-heading"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#6EE7B7]/10 via-[#F8FAFC] to-[#5BC0FF]/15"
          aria-hidden
        />
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[#5BC0FF]/15 blur-3xl" aria-hidden />
        <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[#6EE7B7]/15 blur-3xl" aria-hidden />

        <div className="container relative z-10 mx-auto px-6">
          <Reveal>
            <h2
              id="program-video-heading"
              className="heading-gradient mb-3 text-center text-3xl font-bold md:text-4xl"
            >
              {pv.title[lang]}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">
              {pv.subtitle[lang]}
            </p>
          </Reveal>
          {videoBlock}
        </div>
      </section>
      {modal}
    </>
  );
}
