import { useCallback, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { buildYouTubeEmbedUrl, type ProgramVideoSource } from '@/constants/program-video';

type CloseMethod = 'button' | 'escape' | 'backdrop';

type Props = {
  open: boolean;
  source: ProgramVideoSource | null;
  onClose: (method: CloseMethod) => void;
  closeLabel: string;
  unavailableLabel: string;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

export function ProgramVideoModal({
  open,
  source,
  onClose,
  closeLabel,
  unavailableLabel,
  returnFocusRef,
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(
    (method: CloseMethod) => {
      onClose(method);
      requestAnimationFrame(() => returnFocusRef?.current?.focus());
    },
    [onClose, returnFocusRef]
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose('escape');
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], iframe, video, [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusable).filter((el) => !el.hasAttribute('disabled'));
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] animate-in fade-in duration-200"
      onClick={() => handleClose('backdrop')}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-4xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
          <p id={titleId} className="sr-only">
            {closeLabel}
          </p>
          <div className="aspect-video w-full max-h-[min(80dvh,56.25vw)] bg-black">
            {source?.type === 'youtube' ? (
              <iframe
                title="15 Lessons English Program"
                src={buildYouTubeEmbedUrl(source.videoId)}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : source?.type === 'mp4' ? (
              <video
                src={source.src}
                controls
                playsInline
                autoPlay
                className="h-full w-full bg-black"
                controlsList="nodownload"
              >
                <track kind="captions" />
              </video>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/90 sm:text-base">
                {unavailableLabel}
              </div>
            )}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => handleClose('button')}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-foreground shadow-lg transition-colors hover:bg-white touch-manipulation"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
