import { SITE_NAME, SITE_URL } from "@/constants/seo";
import type { Lang } from "@/constants/seo";
import { HOME_FAQ, SCHEDULE_EVENTS, HOTEL_COURSES } from "@/constants/seo-content";

function JsonLdScript({ id, data }: { id: string; data: object }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd({ lang }: { lang: Lang }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: "MLTCENTERS",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/og-image.jpg`,
    description:
      lang === "th"
        ? "ศูนย์ฝึกอบรมภาษาสมัยใหม่ เวิร์กช็อปภาษาและทัศนศึกษาต่างประเทศด้วย AI และเทคโนโลยี"
        : "Modern language training center — workshops and study-travel programs with AI and technology.",
    email: "mltcenterth@gmail.com",
    telephone: "+66-94-852-1188",
    address: {
      "@type": "PostalAddress",
      streetAddress: "157/160-161 Moo.9 Teparuk KM.18 Bangpla",
      addressLocality: "Bang Phli",
      addressRegion: "Samut Prakan",
      postalCode: "10540",
      addressCountry: "TH",
    },
    sameAs: [
      "https://www.facebook.com/mltcenterbykrumam/",
      "https://www.youtube.com/@Krumamclub",
      "https://www.tiktok.com/@krumamclub",
    ],
    areaServed: { "@type": "Country", name: "Thailand" },
    knowsAbout: [
      "English language learning",
      "AI education",
      "Study abroad programs",
      "Language workshops",
    ],
  };

  return <JsonLdScript id="json-ld-organization" data={data} />;
}

export function WebPageJsonLd({
  title,
  description,
  url,
  type,
  lang,
}: {
  title: string;
  description: string;
  url: string;
  type: string;
  lang: Lang;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: lang === "th" ? "th-TH" : "en-US",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: ["th-TH", "en-US"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/activities?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLdScript id="json-ld-website" data={website} />
      <JsonLdScript id="json-ld-webpage" data={data} />
    </>
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLdScript id="json-ld-breadcrumb" data={data} />;
}

export function FaqJsonLd({ lang }: { lang: Lang }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ[lang].map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  return <JsonLdScript id="json-ld-faq" data={data} />;
}

export function ScheduleEventsJsonLd({ lang }: { lang: Lang }) {
  const events = [
    ...SCHEDULE_EVENTS.map((e) => ({
      "@type": "Event",
      "@id": `${SITE_URL}/schedule#${e.id}`,
      name: e.title[lang],
      description: e.desc[lang],
      startDate: e.startDate,
      endDate: e.endDate,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: e.location[lang],
        address: { "@type": "PostalAddress", addressCountry: "International" },
      },
      organizer: { "@id": `${SITE_URL}/#organization` },
      image: `${SITE_URL}/og-image.jpg`,
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/register`,
        availability: "https://schema.org/InStock",
      },
    })),
    ...HOTEL_COURSES.map((c) => ({
      "@type": "Course",
      "@id": `${SITE_URL}/schedule#${c.id}`,
      name: c.title[lang],
      description: c.desc[lang],
      provider: { "@id": `${SITE_URL}/#organization` },
      hasCourseInstance: {
        "@type": "CourseInstance",
        startDate: c.startDate,
        courseMode: "onsite",
        location: {
          "@type": "Place",
          name: lang === "th" ? "โรงแรมพันธมิตร กรุงเทพฯ และสมุทรปราการ" : "Partner hotels, Bangkok & Samut Prakan",
        },
      },
    })),
  ];

  const data = {
    "@context": "https://schema.org",
    "@graph": events,
  };

  return <JsonLdScript id="json-ld-schedule" data={data} />;
}

export function ActivitiesItemListJsonLd({
  lang,
  items,
}: {
  lang: Lang;
  items: { name: string; description: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: lang === "th" ? "กิจกรรม MLTCENTERS" : "MLTCENTERS Activities",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LearningResource",
        name: item.name,
        description: item.description,
        provider: { "@id": `${SITE_URL}/#organization` },
      },
    })),
  };
  return <JsonLdScript id="json-ld-activities" data={data} />;
}
