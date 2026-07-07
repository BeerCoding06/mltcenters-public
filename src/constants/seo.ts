export const SITE_URL = "https://www.mltcenters.com";
export const SITE_NAME = "MLTCENTERS Workshop";
export const SITE_NAME_SHORT = "MLTCENTERS";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
export const DEFAULT_OG_IMAGE_ALT = "MLTCENTERS — เรียนภาษาผ่านเทคโนโลยีและ AI";

export type Lang = "en" | "th";

export interface PageSeoConfig {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  keywords?: Record<Lang, string>;
  path: string;
  noindex?: boolean;
  ogImage?: string;
  ogImageAlt?: Record<Lang, string>;
  jsonLdType?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";
}

export const PAGE_SEO: Record<string, PageSeoConfig> = {
  "/": {
    path: "/",
    title: {
      th: "MLTCENTERS | เรียนภาษาผ่านเทคโนโลยี AI — เวิร์กช็อปภาษา",
      en: "MLTCENTERS | Learn Languages with AI & Technology Workshops",
    },
    description: {
      th: "MLTCENTERS เวิร์กช็อปเรียนภาษาอังกฤษและภาษาต่างประเทศด้วย AI เกม 3D และกิจกรรมเชิงปฏิบัติการ ทัศนศึกษาต่างประเทศ ลงทะเบียนออนไลน์ได้เลย",
      en: "MLTCENTERS — interactive language workshops with AI chat, 3D games, and hands-on activities. Study-travel programs abroad. Register online today.",
    },
    keywords: {
      th: "เรียนภาษาอังกฤษ,เวิร์กช็อปภาษา,MLTCENTERS,เรียนภาษาด้วย AI,ทัศนศึกษาต่างประเทศ,เกมเรียนภาษาอังกฤษ",
      en: "language workshop,learn English Thailand,MLTCENTERS,AI language learning,study travel,English game",
    },
    ogImageAlt: {
      th: "เด็กและครูเรียนภาษาผ่านเทคโนโลยีที่ MLTCENTERS",
      en: "Students learning languages with technology at MLTCENTERS",
    },
  },
  "/about": {
    path: "/about",
    jsonLdType: "AboutPage",
    title: {
      th: "เกี่ยวกับเรา | MLTCENTERS — เวิร์กช็อปภาษาและเทคโนโลยี",
      en: "About Us | MLTCENTERS — Language & Technology Workshops",
    },
    description: {
      th: "ทำความรู้จัก MLTCENTERS เวิร์กช็อปที่ผสานการเรียนภาษากับ AI แอปเรียนภาษา เกมทีม และทักษะการนำเสนอดิจิทัล ในบรรยากาศสนุกและปลอดภัย",
      en: "Discover MLTCENTERS — workshops blending language learning with AI, language apps, team games, and digital presentation skills in a fun, supportive setting.",
    },
  },
  "/activities": {
    path: "/activities",
    jsonLdType: "CollectionPage",
    title: {
      th: "กิจกรรม | MLTCENTERS — ฝึกภาษาด้วย AI เกม และเทคโนโลยี",
      en: "Activities | MLTCENTERS — AI, Games & Tech Language Practice",
    },
    description: {
      th: "กิจกรรม MLTCENTERS: ฝึกสนทนาด้วย AI แอปเรียนภาษา เกมภาษาแบบทีม พรีเซนต์ดิจิทัล และเกมวิ่ง 3D ฝึกภาษาอังกฤษ — สนุกและได้ทักษะจริง",
      en: "MLTCENTERS activities: AI conversation practice, language apps, team games, digital presentations, and a 3D English runner game — fun and practical.",
    },
  },
  "/schedule": {
    path: "/schedule",
    title: {
      th: "กำหนดการ | MLTCENTERS — ทัศนศึกษาและเวิร์กช็อปภาษา",
      en: "Schedule | MLTCENTERS — Study Tours & Language Workshops",
    },
    description: {
      th: "ดูกำหนดการทัศนศึกษาต่างประเทศ สิงคโปร์ มาเลเซีย ญี่ปุ่น เกาหลี และเวิร์กช็อปภาษาที่โรงแรม MLTCENTERS — อัปเดตที่นั่งและรอบเรียนล่าสุด",
      en: "View MLTCENTERS study-travel programs (Singapore, Malaysia, Japan, Korea) and hotel workshops — latest dates and seat availability.",
    },
  },
  "/gallery": {
    path: "/gallery",
    jsonLdType: "CollectionPage",
    title: {
      th: "แกลเลอรี | MLTCENTERS — ภาพบรรยากาศกิจกรรม",
      en: "Gallery | MLTCENTERS — Workshop Moments & Photos",
    },
    description: {
      th: "ชมภาพบรรยากาศกิจกรรม MLTCENTERS เวิร์กช็อปภาษา ทัศนศึกษา และการเรียนรู้ด้วยเทคโนโลยีจากรุ่นก่อน — ภาพจริงจากคลาสและทริปต่างประเทศ",
      en: "Browse real photos from MLTCENTERS language workshops, study tours, and technology-enhanced classes — moments from our learners abroad.",
    },
  },
  "/register": {
    path: "/register",
    title: {
      th: "ลงทะเบียน | MLTCENTERS — สมัครเวิร์กช็อปภาษาออนไลน์",
      en: "Register | MLTCENTERS — Sign Up for Language Workshops",
    },
    description: {
      th: "ลงทะเบียนเข้าร่วมเวิร์กช็อป MLTCENTERS ออนไลน์ กรอกข้อมูลง่าย ๆ รับยืนยันทางอีเมล จองที่นั่งทัศนศึกษาและคอร์สภาษาได้ทันที",
      en: "Register online for MLTCENTERS workshops and study-travel programs. Quick sign-up, email confirmation, and instant seat reservation.",
    },
  },
  "/contact": {
    path: "/contact",
    jsonLdType: "ContactPage",
    title: {
      th: "ติดต่อเรา | MLTCENTERS — สอบถามเวิร์กช็อปและทัศนศึกษา",
      en: "Contact | MLTCENTERS — Ask About Workshops & Tours",
    },
    description: {
      th: "ติดต่อ MLTCENTERS โทร 094-852-1188 อีเมล mltcenterth@gmail.com สมุทรปราการ สอบถามกำหนดการ ราคา ทัศนศึกษา และการลงทะเบียนได้ทุกวัน",
      en: "Contact MLTCENTERS — phone 094-852-1188, email mltcenterth@gmail.com, Samut Prakan. Ask about schedules, tours, pricing, and registration.",
    },
  },
  "/assessment": {
    path: "/assessment",
    noindex: true,
    title: {
      th: "คุยภาษาอังกฤษกับ AI | MLTCENTERS",
      en: "Chat English with AI | MLTCENTERS",
    },
    description: {
      th: "ฝึกพูดภาษาอังกฤษกับ AI แบบสนทนาจริง เลือกสถานการณ์จำลอง ฟรีสำหรับผู้เรียน MLTCENTERS",
      en: "Practice English conversation with AI. Choose real-life scenarios. Free tool for MLTCENTERS learners.",
    },
  },
  "/assessment/dashboard": {
    path: "/assessment/dashboard",
    noindex: true,
    title: {
      th: "ผลประเมินภาษาอังกฤษ | MLTCENTERS",
      en: "English Assessment Results | MLTCENTERS",
    },
    description: {
      th: "ดูผลการประเมินภาษาอังกฤษจากการสนทนากับ AI",
      en: "View your English assessment results from AI conversation practice.",
    },
  },
};

export const SITEMAP_PATHS = [
  "/",
  "/about",
  "/activities",
  "/schedule",
  "/gallery",
  "/register",
  "/contact",
] as const;

export function getPageSeo(pathname: string, lang: Lang): PageSeoConfig | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (PAGE_SEO[normalized]) return PAGE_SEO[normalized];
  return null;
}

export function resolveSeoFields(config: PageSeoConfig, lang: Lang) {
  const canonical = `${SITE_URL}${config.path === "/" ? "/" : config.path}`;
  return {
    title: config.title[lang],
    description: config.description[lang],
    keywords: config.keywords?.[lang],
    canonical,
    ogImage: config.ogImage ?? DEFAULT_OG_IMAGE,
    ogImageAlt: config.ogImageAlt?.[lang] ?? DEFAULT_OG_IMAGE_ALT,
    noindex: config.noindex ?? false,
    path: config.path,
    jsonLdType: config.jsonLdType ?? "WebPage",
  };
}
