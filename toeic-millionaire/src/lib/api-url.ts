/**
 * Prefix API paths with Next.js basePath (`/millionaire`).
 * Browser `fetch('/api/...')` ignores basePath and hits the main Express app.
 */
export const APP_BASE_PATH =
  process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || "/millionaire";

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${APP_BASE_PATH}${normalized}`;
}
