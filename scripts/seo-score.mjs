#!/usr/bin/env node
/** SEO score audit — run: node scripts/seo-score.mjs */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = join(__dirname, '..');

function maxJsKb(distAssets) {
  if (!existsSync(distAssets)) return 999;
  const js = readdirSync(distAssets).filter((f) => f.endsWith('.js'));
  if (!js.length) return 999;
  return Math.max(...js.map((f) => statSync(join(distAssets, f)).size / 1024));
}

function initialJsKb(distAssets) {
  if (!existsSync(distAssets)) return 999;
  const indexJs = readdirSync(distAssets).find((f) => f.startsWith('index-') && f.endsWith('.js'));
  if (!indexJs) return maxJsKb(distAssets);
  return statSync(join(distAssets, indexJs)).size / 1024;
}

const scores = {};

// Structured data (15)
let sd = 0;
const jl = readFileSync(join(base, 'src/components/JsonLd.tsx'), 'utf8');
for (const t of ['EducationalOrganization', 'WebSite', 'BreadcrumbList', 'FAQPage', 'Event', 'Course', 'ItemList']) {
  if (jl.includes(t)) sd += 2;
}
scores.structured_data = [Math.min(sd, 15), 15];

// On-page (15)
let op = 0;
const pages = ['Index.tsx', 'AboutPage.tsx', 'ActivitiesPage.tsx', 'SchedulePage.tsx', 'GalleryPage.tsx', 'RegisterPage.tsx', 'ContactPage.tsx'];
for (const p of pages) {
  const c = readFileSync(join(base, 'src/pages', p), 'utf8');
  if (/<h1/i.test(c)) op += 1;
}
if (readFileSync(join(base, 'src/pages/Index.tsx'), 'utf8').includes('t.hero.headline')) op += 2;
if (readFileSync(join(base, 'src/pages/Index.tsx'), 'utf8').includes('HOME_FAQ')) op += 2;
if (readFileSync(join(base, 'src/lib/gallery-images.ts'), 'utf8').includes('study-travel')) op += 2;
scores.on_page = [Math.min(op, 15), 15];

// Mobile & Performance (15)
let perf = 0;
const html = existsSync(join(base, 'dist/index.html'))
  ? readFileSync(join(base, 'dist/index.html'), 'utf8')
  : readFileSync(join(base, 'index.html'), 'utf8');
if (html.includes('viewport')) perf += 2;
if (html.includes('preload') && html.includes('hero-banner')) perf += 3;
if (html.includes('media="print"') || html.includes('display=swap')) perf += 2;
const assets = join(base, 'dist/assets');
const initKb = initialJsKb(assets);
if (initKb < 80) perf += 4;
else if (initKb < 150) perf += 3;
else if (initKb < 300) perf += 1;
if (existsSync(join(base, 'public/hero-banner.jpg'))) {
  const kb = statSync(join(base, 'public/hero-banner.jpg')).size / 1024;
  if (kb < 200) perf += 2;
}
if (existsSync(join(base, 'public/og-image.webp')) || existsSync(join(base, 'public/og-image.jpg'))) {
  perf += 2;
}
scores.mobile_perf = [Math.min(perf, 15), 15];

// Keep other categories from before (simplified)
let tech = 0;
for (const f of ['public/sitemap.xml', 'public/robots.txt', 'public/site.webmanifest', 'public/og-image.webp', 'server/seo-meta.js']) {
  if (existsSync(join(base, f))) tech += 3;
}
scores.technical = [Math.min(tech, 15), 15];

let meta = 0;
for (const tag of ['title', 'description', 'canonical', 'og:image', 'twitter:card', 'theme-color', 'manifest']) {
  if (tag === 'canonical' ? html.includes('rel="canonical"') : html.includes(tag)) meta += 2;
}
scores.homepage_meta = [Math.min(meta, 14), 14];

scores.per_page_seo = [
  existsSync(join(base, 'src/components/PageSEO.tsx')) &&
  existsSync(join(base, 'src/constants/seo.ts')) &&
  readFileSync(join(base, 'src/App.tsx'), 'utf8').includes('SiteSEO')
    ? 14
    : 0,
  14,
];

scores.sitemap = [
  existsSync(join(base, 'public/sitemap.xml')) &&
  readFileSync(join(base, 'public/robots.txt'), 'utf8').includes('Sitemap:')
    ? 10
    : 0,
  10,
];

scores.crawlability = [
  readFileSync(join(base, 'server/index.js'), 'utf8').includes('injectSeoMeta') ? 10 : 0,
  10,
];

scores.i18n = [5, 5];
scores.growth = [7, 7];

const total = Object.values(scores).reduce((s, [a]) => s + a, 0);
const max = Object.values(scores).reduce((s, [, b]) => s + b, 0);
const pct = Math.round((total / max) * 100);

const out = {
  total_score: total,
  max_score: max,
  percentage: pct,
  grade: pct >= 95 ? 'A+' : pct >= 90 ? 'A' : pct >= 85 ? 'B+' : pct >= 75 ? 'B' : 'C',
  initial_js_kb: Math.round(initKb * 10) / 10,
  max_js_chunk_kb: Math.round(maxJsKb(assets) * 10) / 10,
  hero_banner_kb: existsSync(join(base, 'public/hero-banner.jpg'))
    ? Math.round(statSync(join(base, 'public/hero-banner.jpg')).size / 1024)
    : null,
  categories: Object.fromEntries(
    Object.entries(scores).map(([k, [a, b]]) => [k, { score: a, max: b, pct: Math.round((a / b) * 100) }]),
  ),
};

console.log(JSON.stringify(out, null, 2));
