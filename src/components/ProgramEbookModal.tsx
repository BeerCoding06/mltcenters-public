import { useCallback, useEffect, useId, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { PROGRAM_EBOOK_PDF, PROGRAM_EBOOK_FILENAME } from '@/constants/program-ebook';

type CloseMethod = 'button' | 'escape' | 'backdrop';

type Props = {
  open: boolean;
  onClose: (method: CloseMethod) => void;
  title: string;
  closeLabel: string;
  downloadLabel: string;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  onDownload?: () => void;
};

export function ProgramEbookModal({
  open,
  onClose,
  title,
  closeLabel,
  downloadLabel,
  returnFocusRef,
  onDownload,
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
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4 animate-in fade-in duration-200"
      onClick={() => handleClose('backdrop')}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-[min(92dvh,900px)] w-full max-w-5xl flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-[#F8FAFC] px-3 py-2.5 sm:px-4">
            <h2 id={titleId} className="truncate text-sm font-semibold text-foreground sm:text-base">
              {title}
            </h2>
            <div className="flex shrink-0 items-center gap-1.5">
              <a
                href={PROGRAM_EBOOK_PDF}
                download={PROGRAM_EBOOK_FILENAME}
                onClick={onDownload}
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-[#5BC0FF]/15 hover:text-[#5BC0FF] touch-manipulation"
                aria-label={downloadLabel}
                title={downloadLabel}
              >
                <Download className="h-4 w-4" aria-hidden />
              </a>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => handleClose('button')}
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted touch-manipulation"
                aria-label={closeLabel}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
          <iframe
            title={title}
            src={`${PROGRAM_EBOOK_PDF}#toolbar=1&navpanes=0`}
            className="min-h-0 flex-1 w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
