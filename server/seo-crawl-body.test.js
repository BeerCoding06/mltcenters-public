// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { buildCrawlHtml } from './seo-crawl-body.js';
import { injectSeoMeta } from './seo-meta.js';

describe('buildCrawlHtml', () => {
  it('includes h1, headings, internal links, and external links on home', () => {
    const html = buildCrawlHtml('/', {
      h1: 'เรียนภาษาผ่านเทคโนโลยี',
      description: 'MLTCENTERS เวิร์กช็อปเรียนภาษาอังกฤษ',
      title: 'MLTCENTERS',
      path: '/',
    });

    expect(html).toContain('<h1>');
    expect(html).toContain('เรียนภาษาผ่านเทคโนโลยี');
    expect(html).toContain('<h2>');
    expect(html).toContain('href="https://www.mltcenters.com/about"');
    expect(html).toContain('href="https://www.facebook.com/mltcenterbykrumam/"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('includes page-specific h2 on about', () => {
    const html = buildCrawlHtml('/about', {
      h1: 'เกี่ยวกับ MLTCENTERS',
      description: 'about page',
      title: 'About',
      path: '/about',
    });

    expect(html).toContain('<h1>เกี่ยวกับ MLTCENTERS</h1>');
    expect(html).toContain('<h2>เกี่ยวกับ MLTCENTERS</h2>');
  });
});

describe('injectSeoMeta', () => {
  it('replaces static seo fallback with route-specific crawl html', () => {
    const template = `<!doctype html><html><head><title>Old</title><meta name="description" content="old" /><meta name="robots" content="index, follow" /><link rel="canonical" href="https://www.mltcenters.com/" /></head><body><main id="main-content" class="seo-fallback"><h1>Old</h1></main><div id="root"></div></body></html>`;
    const out = injectSeoMeta(template, {
      title: 'About | MLTCENTERS',
      description: 'About desc',
      h1: 'เกี่ยวกับ MLTCENTERS',
      path: '/about',
    });

    expect(out).toContain('<h1>เกี่ยวกับ MLTCENTERS</h1>');
    expect(out).toContain('href="https://www.mltcenters.com/register"');
    expect(out).not.toContain('<h1>Old</h1>');
  });
});
