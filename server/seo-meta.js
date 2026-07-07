/** Server-side SEO meta for crawler / social-bot HTML injection (SPA fallback). */
import { buildJsonLdHtml } from './seo-jsonld.js';

export const SITE_URL = 'https://www.mltcenters.com';
export const SITE_NAME = 'MLTCENTERS Workshop';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.webp`;

const BOT_UA =
  /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|pinterest|applebot/i;

/** All valid SPA routes (must match src/App.tsx). */
export const KNOWN_SPA_PATHS = new Set([
  '/',
  '/about',
  '/activities',
  '/schedule',
  '/gallery',
  '/register',
  '/contact',
  '/assessment',
  '/assessment/dashboard',
]);

const NOT_FOUND_META = {
  title: 'ไม่พบหน้า | MLTCENTERS',
  description: 'ไม่พบหน้าที่คุณต้องการ — กลับไปหน้าแรก MLTCENTERS',
  noindex: true,
  notFound: true,
};

/** @type {Record<string, { title: string; description: string; noindex?: boolean; h1?: string }>} */
export const PAGE_META = {
  '/': {
    title: 'MLTCENTERS | เรียนภาษาผ่านเทคโนโลยี AI — เวิร์กช็อปภาษาสมัยใหม่',
    h1: 'เรียนภาษาผ่านเทคโนโลยี',
    description:
      'MLTCENTERS เวิร์กช็อปเรียนภาษาอังกฤษและภาษาต่างประเทศด้วย AI เกม 3D และกิจกรรมเชิงปฏิบัติการ ทัศนศึกษาต่างประเทศ ลงทะเบียนออนไลน์ได้เลย',
  },
  '/about': {
    title: 'เกี่ยวกับเรา | MLTCENTERS — เวิร์กช็อปภาษาและเทคโนโลยี',
    h1: 'เกี่ยวกับ MLTCENTERS',
    description:
      'ทำความรู้จัก MLTCENTERS เวิร์กช็อปที่ผสานการเรียนภาษากับ AI แอปเรียนภาษา เกมทีม และทักษะการนำเสนอดิจิทัล',
  },
  '/activities': {
    title: 'กิจกรรม | MLTCENTERS — ฝึกภาษาด้วย AI เกม และเทคโนโลยี',
    h1: 'กิจกรรมในงาน',
    description:
      'กิจกรรม MLTCENTERS: ฝึกสนทนาด้วย AI แอปเรียนภาษา เกมภาษาแบบทีม พรีเซนต์ดิจิทัล และเกมวิ่ง 3D ฝึกภาษาอังกฤษ',
  },
  '/schedule': {
    title: 'กำหนดการ | MLTCENTERS — ทัศนศึกษาและเวิร์กช็อปภาษา',
    h1: 'กำหนดการทัศนศึกษาและเวิร์กช็อป',
    description:
      'ดูกำหนดการทัศนศึกษาต่างประเทศ (สิงคโปร์ มาเลเซีย เกาหลี) และเวิร์กช็อปภาษาที่โรงแรม MLTCENTERS',
  },
  '/gallery': {
    title: 'แกลเลอรี | MLTCENTERS — ภาพบรรยากาศกิจกรรม',
    h1: 'แกลเลอรีภาพกิจกรรม',
    description: 'ชมภาพบรรยากาศกิจกรรม MLTCENTERS เวิร์กช็อปภาษา ทัศนศึกษา และการเรียนรู้ด้วยเทคโนโลยี',
  },
  '/register': {
    title: 'ลงทะเบียน | MLTCENTERS — สมัครเวิร์กช็อปภาษาออนไลน์',
    h1: 'ลงทะเบียนเวิร์กช็อป',
    description:
      'ลงทะเบียนเข้าร่วมเวิร์กช็อป MLTCENTERS ออนไลน์ จองที่นั่งทัศนศึกษาและคอร์สภาษา',
  },
  '/contact': {
    title: 'ติดต่อเรา | MLTCENTERS — สอบถามเวิร์กช็อปและทัศนศึกษา',
    h1: 'ติดต่อ MLTCENTERS',
    description:
      'ติดต่อ MLTCENTERS โทร 094-852-1188 อีเมล mltcenterth@gmail.com สมุทรปราการ',
  },
  '/assessment': {
    title: 'คุยภาษาอังกฤษกับ AI | MLTCENTERS',
    h1: 'คุยภาษาอังกฤษ',
    description: 'ฝึกพูดภาษาอังกฤษกับ AI แบบสนทนาจริง เลือกสถานการณ์จำลอง',
    noindex: true,
  },
  '/assessment/dashboard': {
    title: 'ผลประเมินภาษาอังกฤษ | MLTCENTERS',
    h1: 'ผลประเมินภาษาอังกฤษ',
    description: 'ดูผลการประเมินภาษาอังกฤษจากการสนทนากับ AI',
    noindex: true,
  },
};

export const RUNNER_META = {
  title: 'เกมวิ่งภาษาอังกฤษ 3D | MLTCENTERS — ฝึกอ่านและตอบคำถามขณะวิ่ง',
  h1: 'เกมวิ่งภาษาอังกฤษ 3D',
  description:
    'เกมวิ่ง 3D ฝึกภาษาอังกฤษสำหรับเด็ก — อ่านคำถาม ตอบขณะวิ่ง สนุกและได้เรียนรู้ไปพร้อมกัน จาก MLTCENTERS',
};

export function isCrawler(userAgent = '') {
  return BOT_UA.test(userAgent);
}

export function normalizePath(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';
  return p;
}

export function isKnownSpaPath(pathname) {
  const p = normalizePath(pathname);
  if (p.startsWith('/runner-app')) return true;
  return KNOWN_SPA_PATHS.has(p);
}

export function getMetaForPath(pathname) {
  const p = normalizePath(pathname);
  if (p.startsWith('/runner-app')) return { ...RUNNER_META, path: '/runner-app/' };
  const page = PAGE_META[p];
  if (!page) return { ...NOT_FOUND_META, path: p };
  return { ...page, path: p };
}

/**
 * @param {string} html
 * @param {{ title: string; description: string; path: string; h1?: string; noindex?: boolean; notFound?: boolean }} meta
 */
export function injectSeoMeta(html, meta) {
  const canonical = `${SITE_URL}${meta.path === '/' ? '/' : meta.path}`;
  const robots = meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');

  let out = html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${esc(meta.description)}" />`,
    )
    .replace(
      /<meta name="robots" content="[^"]*"\s*\/?>/,
      `<meta name="robots" content="${robots}" />`,
    )
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${esc(canonical)}" />`,
    )
    .replace(
      /<meta property="og:url" content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${esc(canonical)}" />`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${esc(meta.title)}" />`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${esc(meta.description)}" />`,
    )
    .replace(
      /<meta property="og:image" content="[^"]*"\s*\/?>/,
      `<meta property="og:image" content="${esc(DEFAULT_OG_IMAGE)}" />`,
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    )
    .replace(
      /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:image" content="${esc(DEFAULT_OG_IMAGE)}" />`,
    );

  if (!out.includes('rel="canonical"')) {
    out = out.replace('</head>', `  <link rel="canonical" href="${esc(canonical)}" />\n  </head>`);
  }

  const jsonLd = buildJsonLdHtml(meta.path, meta);
  if (jsonLd && !out.includes('json-ld-organization')) {
    out = out.replace('</head>', `    ${jsonLd}\n  </head>`);
  }

  const h1 = meta.h1 || meta.title.split('|')[0].trim();
  const crawlBody = `<noscript><main id="seo-static"><h1>${esc(h1)}</h1><p>${esc(meta.description)}</p></main></noscript>`;
  if (!out.includes('id="seo-static"')) {
    out = out.replace('<div id="root"></div>', `<div id="root"></div>\n    ${crawlBody}`);
  }

  return out;
}
