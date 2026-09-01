export const PROGRAM_VIDEO_POSTER = '/assets/img-design-about/15-lessons-poster.webp';

const YOUTUBE_ID = (import.meta.env.VITE_PROGRAM_VIDEO_YOUTUBE_ID ?? '').trim();
const MP4_SRC = (import.meta.env.VITE_PROGRAM_VIDEO_SRC ?? '/assets/video/15-Lessons-English-Program.mp4').trim();

export type ProgramVideoSource =
  | { type: 'youtube'; videoId: string }
  | { type: 'mp4'; src: string };

export function getProgramVideoSource(): ProgramVideoSource | null {
  if (YOUTUBE_ID) return { type: 'youtube', videoId: YOUTUBE_ID };
  if (MP4_SRC) return { type: 'mp4', src: MP4_SRC };
  return null;
}

export function buildYouTubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    modestbranding: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params}`;
}
