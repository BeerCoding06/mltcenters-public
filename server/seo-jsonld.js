import {
  HOME_FAQ_TH,
  SCHEDULE_EVENTS,
  HOTEL_COURSES,
  ACTIVITY_ITEMS,
  BREADCRUMB_LABELS,
} from './seo-content-data.js';

const SITE_URL = 'https://www.mltcenters.com';
const SITE_NAME = 'MLTCENTERS Workshop';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.webp`;

/** @type {Record<string, string>} */
const JSON_LD_PAGE_TYPE = {
  '/': 'WebPage',
  '/about': 'AboutPage',
  '/contact': 'ContactPage',
  '/activities': 'CollectionPage',
  '/gallery': 'CollectionPage',
};

function scriptTag(id, data) {
  return `<script id="${id}" type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: 'MLTCENTERS',
    url: SITE_URL,
    logo: `${SITE_URL}/icon-192.png`,
    image: DEFAULT_OG_IMAGE,
    description:
      'ศูนย์ฝึกอบรมภาษาสมัยใหม่ เวิร์กช็อปภาษาและทัศนศึกษาต่างประเทศด้วย AI และเทคโนโลยี',
    email: 'mltcenterth@gmail.com',
    telephone: '+66-94-852-1188',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '157/160-161 Moo.9 Teparuk KM.18 Bangpla',
      addressLocality: 'Bang Phli',
      addressRegion: 'Samut Prakan',
      postalCode: '10540',
      addressCountry: 'TH',
    },
    sameAs: [
      'https://www.facebook.com/mltcenterbykrumam/',
      'https://www.youtube.com/@Krumamclub',
      'https://www.tiktok.com/@krumamclub',
    ],
    areaServed: { '@type': 'Country', name: 'Thailand' },
    knowsAbout: [
      'English language learning',
      'AI education',
      'Study abroad programs',
      'Language workshops',
    ],
  };
}

function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: ['th-TH', 'en-US'],
  };
}

function webPageLd(path, title, description) {
  const url = `${SITE_URL}${path === '/' ? '/' : path}`;
  return {
    '@context': 'https://schema.org',
    '@type': JSON_LD_PAGE_TYPE[path] || 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: 'th-TH',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
  };
}

function faqLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQ_TH.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

function breadcrumbLd(path, pageTitle) {
  if (path === '/') return '';
  const crumbs = [
    { name: BREADCRUMB_LABELS['/'], url: `${SITE_URL}/` },
    { name: BREADCRUMB_LABELS[path] || pageTitle, url: `${SITE_URL}${path}` },
  ];
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return scriptTag('json-ld-breadcrumb', data);
}

function scheduleLd() {
  const events = [
    ...SCHEDULE_EVENTS.map((e) => ({
      '@type': 'Event',
      '@id': `${SITE_URL}/schedule#${e.id}`,
      name: e.title,
      description: e.desc,
      startDate: e.startDate,
      endDate: e.endDate,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: {
        '@type': 'Place',
        name: e.location,
        address: { '@type': 'PostalAddress', addressCountry: 'International' },
      },
      organizer: { '@id': `${SITE_URL}/#organization` },
      image: DEFAULT_OG_IMAGE,
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/register`,
        availability: 'https://schema.org/InStock',
      },
    })),
    ...HOTEL_COURSES.map((c) => ({
      '@type': 'Course',
      '@id': `${SITE_URL}/schedule#${c.id}`,
      name: c.title,
      description: c.desc,
      provider: { '@id': `${SITE_URL}/#organization` },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        startDate: c.startDate,
        courseMode: 'onsite',
        location: {
          '@type': 'Place',
          name: 'โรงแรมพันธมิตร กรุงเทพฯ และสมุทรปราการ',
        },
      },
    })),
  ];
  return scriptTag('json-ld-schedule', { '@context': 'https://schema.org', '@graph': events });
}

function activitiesLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'กิจกรรม MLTCENTERS',
    itemListElement: ACTIVITY_ITEMS.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LearningResource',
        name: item.name,
        description: item.description,
        provider: { '@id': `${SITE_URL}/#organization` },
      },
    })),
  };
  return scriptTag('json-ld-activities', data);
}

/**
 * @param {string} path normalized path
 * @param {{ title: string; description: string }} meta
 */
export function buildJsonLdHtml(path, meta) {
  if (!meta.title || meta.notFound) return '';

  const parts = [
    scriptTag('json-ld-organization', organizationLd()),
    scriptTag('json-ld-website', websiteLd()),
    scriptTag('json-ld-webpage', webPageLd(path, meta.title, meta.description)),
  ];

  if (path === '/') parts.push(scriptTag('json-ld-faq', faqLd()));
  if (path === '/schedule') parts.push(scheduleLd());
  if (path === '/activities') parts.push(activitiesLd());

  const breadcrumb = breadcrumbLd(path, meta.title);
  if (breadcrumb) parts.push(breadcrumb);

  return parts.join('\n    ');
}
