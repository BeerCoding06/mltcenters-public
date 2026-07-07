import { useEffect, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import {
  SITE_NAME,
  SITE_URL,
  getPageSeo,
  resolveSeoFields,
  type Lang,
} from "@/constants/seo";

const SiteJsonLd = lazy(() => import("./SiteJsonLd"));

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
        ogImage: `${SITE_URL}/og-image.webp`,
        ogImageAlt: "MLTCENTERS",
        noindex: true,
        path: pathname,
        jsonLdType: "WebPage" as const,
      };

  useEffect(() => {
    applyHead(fields, lang);
  }, [fields.title, fields.description, fields.canonical, fields.noindex, lang]);

  if (!config) return null;

  return (
    <Suspense fallback={null}>
      <SiteJsonLd />
    </Suspense>
  );
}
