import { useState, useEffect } from 'react';

/** Parallax factors: background slowest, then blobs, then image. Text stays fixed. */
const FACTOR_BG = 0.15;
const FACTOR_BLOBS = 0.25;
const FACTOR_IMAGE = 0.35;
const MOBILE_FACTOR = 0.08; // subtle on mobile to avoid dizzying + performance

export function useParallax(heroHeightPx: number = 600) {
  const [offsets, setOffsets] = useState({ bg: 0, blobs: 0, image: 0 });

  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        const factor = isDesktop ? 1 : MOBILE_FACTOR;
        const y = window.scrollY;
        const capped = Math.min(y, heroHeightPx);
        setOffsets({
          bg: capped * FACTOR_BG * factor,
          blobs: capped * FACTOR_BLOBS * factor,
          image: capped * FACTOR_IMAGE * factor,
        });
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [heroHeightPx]);

  return offsets;
}
