import { cn } from '@/lib/utils';

interface PastelImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  overlay?: boolean;
  className?: string;
  wrapperClassName?: string;
  aspectRatio?: 'video' | 'square' | 'auto';
}

/**
 * Reusable image with pastel theme: soft brightness, rounded corners, light shadow.
 * Optional gradient overlay for hero/cards.
 */
export function PastelImage({
  src,
  alt,
  overlay = false,
  className,
  wrapperClassName,
  aspectRatio = 'auto',
  ...props
}: PastelImageProps) {
  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'square'
        ? 'aspect-square'
        : '';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl',
        aspectClass,
        wrapperClassName
      )}
    >
      <img
        src={src}
        alt={alt}
        className={cn(
          'w-full h-full object-cover img-pastel-tone',
          className
        )}
        loading="lazy"
        {...props}
      />
      {overlay && (
        <div
          className="absolute inset-0 pointer-events-none img-pastel-overlay"
          aria-hidden
        />
      )}
    </div>
  );
}
