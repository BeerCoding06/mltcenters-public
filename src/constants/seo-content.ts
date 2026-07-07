import type { Lang } from "@/constants/seo";

export const HOME_FAQ: Record<Lang, { question: string; answer: string }[]> = {
  th: [
    {
      question: "MLTCENTERS เหมาะกับใครบ้าง?",
      answer: "เหมาะกับนักเรียน นักศึกษา และผู้ที่ต้องการพัฒนาภาษาอังกฤษด้วยเทคโนโลยี AI เกม และกิจกรรมเชิงปฏิบัติการ",
    },
    {
      question: "มีทัศนศึกษาต่างประเทศหรือไม่?",
      answer: "มีโปรแกรมทัศนศึกษา เช่น สิงคโปร์ มาเลเซีย ญี่ปุ่น และเกาหลี ผสานการเที่ยวกับภารกิมใช้ภาษาอังกฤษทุกวัน",
    },
    {
      question: "ลงทะเบียนอย่างไร?",
      answer: "ลงทะเบียนออนไลน์ได้ที่หน้า Register หรือติดต่อโทร 094-852-1188 และอีเมล mltcenterth@gmail.com",
    },
    {
      question: "มีเกมฝึกภาษาอังกฤษฟรีไหม?",
      answer: "มีเกมวิ่ง 3D ฝึกอ่านและตอบคำถามภาษาอังกฤษ และเครื่องมือคุยภาษาอังกฤษกับ AI บนเว็บไซต์",
    },
  ],
  en: [
    {
      question: "Who is MLTCENTERS for?",
      answer: "Students and learners who want to improve English through AI, games, and hands-on workshops.",
    },
    {
      question: "Do you offer study-travel abroad?",
      answer: "Yes — programs to Singapore, Malaysia, Japan, and Korea combine travel with daily English missions.",
    },
    {
      question: "How do I register?",
      answer: "Register online on the Register page or contact us at 094-852-1188 and mltcenterth@gmail.com.",
    },
    {
      question: "Are there free English practice tools?",
      answer: "Yes — try our 3D English runner game and AI English chat tool on the website.",
    },
  ],
};

export const SCHEDULE_EVENTS = [
  {
    id: "singapore-malaysia-2026",
    startDate: "2026-07-01",
    endDate: "2026-08-31",
    title: { th: "ทริปสิงคโปร์ · มาเลเซีย เรียนรู้ผ่านการเดินทาง", en: "Singapore · Malaysia Language Journey" },
    desc: {
      th: "5 วัน — ภาษาอังกฤษที่สนามบินและโรงแรม ภารกิจในเมือง สนทนาในตลาดกลางคืน",
      en: "5 days — airport & hotel English, city missions, night market conversations",
    },
    location: { th: "สิงคโปร์ · มาเลเซีย", en: "Singapore · Kuala Lumpur" },
  },
  {
    id: "japan-2026",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    title: { th: "ทัวร์ญี่ปุ่น วัฒนธรรมและการสื่อสาร", en: "Japan Culture & Communication Tour" },
    desc: {
      th: "6 วัน — ประโยคใช้บนรถไฟ เที่ยววัดศาลเจ้า กิจกรรมทีม",
      en: "6 days — train travel phrases, shrine visits, team challenges",
    },
    location: { th: "โตเกียว · โอซาก้า", en: "Tokyo · Osaka" },
  },
  {
    id: "korea-winter-2026",
    startDate: "2026-12-01",
    endDate: "2027-01-31",
    title: { th: "ค่ายภาษาอังกฤษฤดูหนาว ต่างประเทศ", en: "Winter English Camp Abroad" },
    desc: {
      th: "7 วัน — แชร์วัฒนธรรมเกาหลี สนทนาในห้างและคาเฟ่ Showcase ปิดท้าย",
      en: "7 days — K-culture immersion, shopping & café dialogues, farewell showcase",
    },
    location: { th: "โซล · ปูซาน", en: "Seoul · Busan" },
  },
] as const;

export const HOTEL_COURSES = [
  {
    id: "hotel-front-desk-2026",
    startDate: "2026-03-01",
    title: { th: "ต้อนรับแขก & Front Desk", en: "Front Desk & Guest Welcome" },
    desc: {
      th: "Role-play เช็คอิน ตอบคำขอแขก และ Small talk ในล็อบบี้โรงแรม",
      en: "Role-play check-in, handling requests, and polite small talk in the lobby",
    },
  },
  {
    id: "hotel-restaurant-2026",
    startDate: "2026-04-01",
    title: { th: "ภาษาอังกฤษร้านอาหาร & ห้องจัดเลี้ยง", en: "Restaurant & Banquet English" },
    desc: {
      th: "คำศัพท์เมนู แนะนำอาหาร และนำเสนอในห้องจัดเลี้ยง",
      en: "Menu vocabulary, recommending dishes, and presenting at a banquet table",
    },
  },
  {
    id: "hotel-meeting-2026",
    startDate: "2026-05-01",
    title: { th: "ประชุม & ความมั่นใจในการนำเสนอ", en: "Meetings & Presentation Confidence" },
    desc: {
      th: "สถานการณ์ในห้องประชุมโรงแรม Pitch โดยไม่พึ่งสไลด์",
      en: "Hotel meeting-room scenarios and slide-free pitching",
    },
  },
] as const;
