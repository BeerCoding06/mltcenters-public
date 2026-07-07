import { useState, useEffect } from 'react';

/** Parallax factors: background slowest, then blobs, then image. Text stays fixed. */
const FACTOR_BG = 0.15;
const FACTOR_BLOBS = 0.25;
const FACTOR_IMAGE = 0.35;

/** Parallax only on desktop — skip scroll work on mobile for Lighthouse / battery */
export function useParallax(heroHeightPx: number = 600) {
  const [offsets, setOffsets] = useState({ bg: 0, blobs: 0, image: 0 });

  useEffect(() => {
    if (!window.matchMedia('(min-width: 768px)').matches) return;

    let rafId: number;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        const capped = Math.min(y, heroHeightPx);
        setOffsets({
          bg: capped * FACTOR_BG,
          blobs: capped * FACTOR_BLOBS,
          image: capped * FACTOR_IMAGE,
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
