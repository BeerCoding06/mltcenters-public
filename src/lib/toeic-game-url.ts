/**
 * Resolve the TOEIC Millionaire game URL for the main-site navbar.
 *
 * The game is hosted same-origin at `/millionaire` (Express → Next.js).
 * The old subdomain `toeic.mltcenters.com` was never set up and must never ship.
 */
export function resolveToeicGameUrl(
  raw: string | undefined = import.meta.env.VITE_TOEIC_GAME_URL,
): string {
  const fallback = '/millionaire';
  const value = (raw ?? '').trim();
  if (!value) return fallback;

  // Dead / local targets → always same-origin path
  if (
    /toeic\.mltcenters\.com/i.test(value) ||
    /localhost:\d+/i.test(value) ||
    /127\.0\.0\.1:\d+/i.test(value)
  ) {
    return fallback;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value);
      if (url.pathname === '/millionaire' || url.pathname.startsWith('/millionaire/')) {
        return `${url.pathname}${url.search}` || fallback;
      }
    } catch {
      return fallback;
    }
    return fallback;
  }

  if (value === '/millionaire' || value.startsWith('/millionaire/')) {
    return value;
  }

  return fallback;
}
