import { useI18n } from "@/lib/i18n";
import { useLocation } from "react-router-dom";
import { getPageSeo, resolveSeoFields } from "@/constants/seo";
import { translations } from "@/lib/i18n";
import {
  OrganizationJsonLd,
  WebPageJsonLd,
  BreadcrumbJsonLd,
  FaqJsonLd,
  ScheduleEventsJsonLd,
  ActivitiesItemListJsonLd,
} from "./JsonLd";
import type { Lang } from "@/constants/seo";
import { SITE_URL } from "@/constants/seo";

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

export default function SiteJsonLd() {
  const { pathname } = useLocation();
  const { lang } = useI18n();
  const config = getPageSeo(pathname, lang);

  if (!config) return null;

  const fields = resolveSeoFields(config, lang);

  const crumbs =
    config.path !== "/"
      ? [
          { name: BREADCRUMB_LABELS["/"][lang], url: `${SITE_URL}/` },
          {
            name: BREADCRUMB_LABELS[config.path]?.[lang] ?? fields.title,
            url: fields.canonical,
          },
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
      {config.path === "/" && <FaqJsonLd lang={lang} />}
      {config.path === "/schedule" && <ScheduleEventsJsonLd lang={lang} />}
      {config.path === "/activities" && (
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
