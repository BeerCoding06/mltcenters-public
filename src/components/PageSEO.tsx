import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  SITE_NAME,
  SITE_URL,
  getPageSeo,
  resolveSeoFields,
  type Lang,
} from "@/constants/seo";
import { OrganizationJsonLd, WebPageJsonLd, BreadcrumbJsonLd, FaqJsonLd, ScheduleEventsJsonLd, ActivitiesItemListJsonLd } from "./JsonLd";
import { translations } from "@/lib/i18n";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function applyHead(fields: ReturnType<typeof resolveSeoFields>, lang: Lang) {
  document.title = fields.title;
  document.documentElement.lang = lang;

  upsertMeta("name", "description", fields.description);
  if (fields.keywords) upsertMeta("name", "keywords", fields.keywords);
  upsertMeta(
    "name",
    "robots",
    fields.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
  );
  upsertLink("canonical", fields.canonical);

  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:site_name", SITE_NAME);
  upsertMeta("property", "og:locale", lang === "th" ? "th_TH" : "en_US");
  upsertMeta("property", "og:url", fields.canonical);
  upsertMeta("property", "og:title", fields.title);
  upsertMeta("property", "og:description", fields.description);
  upsertMeta("property", "og:image", fields.ogImage);
  upsertMeta("property", "og:image:alt", fields.ogImageAlt);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", fields.title);
  upsertMeta("name", "twitter:description", fields.description);
  upsertMeta("name", "twitter:image", fields.ogImage);
}

const BREADCRUMB_LABELS: Record<string, Record<Lang, string>> = {
  "/": { th: "หน้าแรก", en: "Home" },
  "/about": { th: "เกี่ยวกับเรา", en: "About" },
  "/activities": { th: "กิจกรรม", en: "Activities" },
  "/schedule": { th: "กำหนดการ", en: "Schedule" },
  "/gallery": { th: "แกลเลอรี", en: "Gallery" },
  "/register": { th: "ลงทะเบียน", en: "Register" },
  "/contact": { th: "ติดต่อ", en: "Contact" },
  "/assessment": { th: "คุยภาษาอังกฤษ", en: "Chat English" },
};

export function SiteSEO() {
  const { pathname } = useLocation();
  const { lang } = useI18n();
  const config = getPageSeo(pathname, lang);

  const fields = config
    ? resolveSeoFields(config, lang)
    : {
        title: lang === "th" ? "ไม่พบหน้า | MLTCENTERS" : "Page Not Found | MLTCENTERS",
        description:
          lang === "th"
            ? "ไม่พบหน้าที่คุณต้องการ — กลับไปหน้าแรก MLTCENTERS"
            : "The page you requested was not found — return to MLTCENTERS home.",
        keywords: undefined,
        canonical: `${SITE_URL}${pathname}`,
        ogImage: `${SITE_URL}/og-image.png`,
        ogImageAlt: "MLTCENTERS",
        noindex: true,
        path: pathname,
        jsonLdType: "WebPage" as const,
      };

  useEffect(() => {
    applyHead(fields, lang);
  }, [fields.title, fields.description, fields.canonical, fields.noindex, lang]);

  const crumbs =
    config && config.path !== "/"
      ? [
          { name: BREADCRUMB_LABELS["/"][lang], url: `${SITE_URL}/` },
          { name: BREADCRUMB_LABELS[config.path]?.[lang] ?? fields.title, url: fields.canonical },
        ]
      : null;

  return (
    <>
      <OrganizationJsonLd lang={lang} />
      <WebPageJsonLd
        title={fields.title}
        description={fields.description}
        url={fields.canonical}
        type={fields.jsonLdType}
        lang={lang}
      />
      {config?.path === "/" && <FaqJsonLd lang={lang} />}
      {config?.path === "/schedule" && <ScheduleEventsJsonLd lang={lang} />}
      {config?.path === "/activities" && (
        <ActivitiesItemListJsonLd
          lang={lang}
          items={translations.activities.items.map((item) => ({
            name: item.title[lang],
            description: item.desc[lang],
          }))}
        />
      )}
      {crumbs && <BreadcrumbJsonLd items={crumbs} />}
    </>
  );
}
