import {
  HOME_FAQ_TH,
  ACTIVITY_ITEMS,
  SCHEDULE_EVENTS,
  BREADCRUMB_LABELS,
} from './seo-content-data.js';

const SITE_URL = 'https://www.mltcenters.com';

const NAV_LINKS = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/about', label: 'เกี่ยวกับเรา' },
  { href: '/activities', label: 'กิจกรรม' },
  { href: '/schedule', label: 'กำหนดการ' },
  { href: '/gallery', label: 'แกลเลอรี' },
  { href: '/register', label: 'ลงทะเบียน' },
  { href: '/contact', label: 'ติดต่อ' },
  { href: '/assessment', label: 'คุยภาษาอังกฤษ' },
  { href: '/runner-app/', label: 'เกมวิ่ง 3D' },
];

const EXTERNAL_LINKS = [
  {
    href: 'https://www.facebook.com/mltcenterbykrumam/',
    label: 'Facebook MLTCENTERS',
  },
  {
    href: 'https://www.youtube.com/@Krumamclub',
    label: 'YouTube Kru Mam Club',
  },
  {
    href: 'https://www.tiktok.com/@krumamclub',
    label: 'TikTok Kru Mam Club',
  },
  {
    href: 'https://goo.gl/maps/FkR7BQL2cycZTmiy6?g_st=al',
    label: 'Google Maps — MLTCENTERS สมุทรปราการ',
  },
  {
    href: 'mailto:mltcenterth@gmail.com',
    label: 'อีเมล mltcenterth@gmail.com',
  },
];

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function abs(path) {
  return `${SITE_URL}${path === '/' ? '/' : path}`;
}

function navHtml(currentPath) {
  const items = NAV_LINKS.map(
    (link) =>
      `<li><a href="${esc(abs(link.href))}"${normalizePath(currentPath) === normalizePath(link.href) ? ' aria-current="page"' : ''}>${esc(link.label)}</a></li>`,
  ).join('');
  return `<nav aria-label="เมนูหลัก"><ul>${items}</ul></nav>`;
}

function externalNavHtml() {
  const items = EXTERNAL_LINKS.map(
    (link) =>
      `<li><a href="${esc(link.href)}" rel="noopener noreferrer">${esc(link.label)}</a></li>`,
  ).join('');
  return `<nav aria-label="ลิงก์ภายนอก"><ul>${items}</ul></nav>`;
}

function normalizePath(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';
  return p.startsWith('/runner-app') ? '/runner-app/' : p;
}

function homeSections() {
  const activities = ACTIVITY_ITEMS.map(
    (item) => `<li><strong>${esc(item.name)}</strong> — ${esc(item.description)}</li>`,
  ).join('');
  const schedule = SCHEDULE_EVENTS.slice(0, 3)
    .map((e) => `<li><a href="${esc(abs('/schedule'))}">${esc(e.title)}</a> — ${esc(e.desc)}</li>`)
    .join('');
  const faq = HOME_FAQ_TH.map(
    (item) =>
      `<section><h3>${esc(item.question)}</h3><p>${esc(item.answer)}</p></section>`,
  ).join('');

  return `
    <section>
      <h2>ทำไมต้องเวิร์กช็อป MLTCENTERS</h2>
      <p>เรียนภาษาอังกฤษด้วย AI เกม 3D และกิจกรรมลงมือทำจริง ในบรรยากาศเป็นกันเองกับ Kru Mam Club</p>
      <p><a href="${esc(abs('/register'))}">ลงทะเบียนเวิร์กช็อป</a> · <a href="${esc(abs('/about'))}">อ่านเพิ่มเติมเกี่ยวกับเรา</a></p>
    </section>
    <section>
      <h2>กิจกรรมเด่น</h2>
      <ul>${activities}</ul>
      <p><a href="${esc(abs('/activities'))}">ดูกิจกรรมทั้งหมด</a></p>
    </section>
    <section>
      <h2>ทัศนศึกษาและกำหนดการ</h2>
      <ul>${schedule}</ul>
      <p><a href="${esc(abs('/schedule'))}">ดูกำหนดการทั้งหมด</a></p>
    </section>
    <section>
      <h2>คำถามที่พบบ่อย</h2>
      ${faq}
    </section>
  `;
}

function pageSections(path) {
  switch (path) {
    case '/about':
      return `<section><h2>เกี่ยวกับ MLTCENTERS</h2><p>เวิร์กช็อปภาษาที่ผสาน AI แอปเรียนภาษา เกมทีม และทักษะการนำเสนอดิจิทัล</p></section>`;
    case '/activities':
      return `<section><h2>กิจกรรมในงาน</h2><ul>${ACTIVITY_ITEMS.map((i) => `<li><strong>${esc(i.name)}</strong> — ${esc(i.description)}</li>`).join('')}</ul></section>`;
    case '/schedule':
      return `<section><h2>กำหนดการทัศนศึกษา</h2><ul>${SCHEDULE_EVENTS.map((e) => `<li>${esc(e.title)} — ${esc(e.desc)}</li>`).join('')}</ul></section>`;
    case '/gallery':
      return `<section><h2>แกลเลอรีภาพกิจกรรม</h2><p>ชมภาพบรรยากาศเวิร์กช็อปเรียนภาษาอังกฤษและทัศนศึกษา MLTCENTERS</p></section>`;
    case '/register':
      return `<section><h2>ลงทะเบียนออนไลน์</h2><p>สมัครเข้าร่วมเวิร์กช็อปภาษาและทัศนศึกษา MLTCENTERS กรอกแบบฟอร์มบนหน้านี้</p></section>`;
    case '/contact':
      return `<section><h2>ติดต่อ MLTCENTERS</h2><p>โทร <a href="tel:+66948521188">094-852-1188</a> · <a href="mailto:mltcenterth@gmail.com">mltcenterth@gmail.com</a></p></section>`;
    case '/assessment':
      return `<section><h2>คุยภาษาอังกฤษกับ AI</h2><p>ฝึกพูดภาษาอังกฤษแบบสนทนาจริง เลือกสถานการณ์จำลอง</p></section>`;
    default:
      if (path.startsWith('/runner-app')) {
        return `<section><h2>เกมวิ่งภาษาอังกฤษ 3D</h2><p>ฝึกอ่านและตอบคำถามภาษาอังกฤษขณะวิ่ง — สนุกและได้เรียนรู้</p></section>`;
      }
      return '';
  }
}

/**
 * @param {string} path
 * @param {{ h1?: string; description?: string; title?: string; notFound?: boolean }} meta
 */
export function buildCrawlHtml(path, meta) {
  const p = normalizePath(path);
  const h1 = meta.h1 || (meta.title ? meta.title.split('|')[0].trim() : 'MLTCENTERS');
  const intro = meta.description || '';
  const breadcrumb =
    p !== '/'
      ? `<p><a href="${esc(abs('/'))}">${esc(BREADCRUMB_LABELS['/'])}</a> › ${esc(BREADCRUMB_LABELS[p] || h1)}</p>`
      : '';

  const sections = p === '/' ? homeSections() : pageSections(p);

  return `<main id="main-content" class="seo-fallback">
  ${breadcrumb}
  <h1>${esc(h1)}</h1>
  <p>${esc(intro)}</p>
  ${navHtml(p)}
  ${sections}
  <section>
    <h2>ติดตามและติดต่อ</h2>
    ${externalNavHtml()}
  </section>
</main>`;
}
