"use client";

import { useState } from "react";
import {
  BookOpen,
  Bot,
  ChevronDown,
  Gamepad2,
  Globe,
  Menu,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { useGameLang } from "@/features/i18n/GameLangProvider";

const BRAND_LOGO = "/logo-nav.png";
const KRUMAM_AVATAR = "/assets/img-design-about/krumam.jpg";
const TOEIC_GAME_URL = "/millionaire";

/** Labels match main-site `src/lib/i18n.tsx` nav copy. */
const navCopy = {
  en: {
    home: "Home",
    about: "About",
    activities: "Activities",
    schedule: "Schedule",
    gallery: "Gallery",
    register: "Register",
    contact: "Contact",
    assessment: "Chat English",
    quizMenu: "AI / Vocab",
    vocab: "Vocabulary",
    quizBoard: "TOEIC Millionaire",
    runner: "3D Runner Game",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    switchToTh: "Switch to Thai",
    switchToEn: "Switch to English",
    brandLogo: "MLTCENTERS logo",
    krumam: "krumam club",
  },
  th: {
    home: "หน้าแรก",
    about: "เกี่ยวกับเรา",
    activities: "กิจกรรม",
    schedule: "กำหนดการ",
    gallery: "แกลเลอรี",
    register: "ลงทะเบียน",
    contact: "ติดต่อ",
    assessment: "คุยภาษาอังกฤษ",
    quizMenu: "AI/คำศัพท์",
    vocab: "ศัพท์",
    quizBoard: "TOEIC เกมส์เศรษฐี",
    runner: "เกมวิ่ง 3D",
    openMenu: "เปิดเมนู",
    closeMenu: "ปิดเมนู",
    switchToTh: "เปลี่ยนเป็นภาษาไทย",
    switchToEn: "Switch to English",
    brandLogo: "โลโก้ MLTCENTERS",
    krumam: "krumam club",
  },
} as const;

type NavLink = {
  label: string;
  path: string;
};

/**
 * Pixel-matched MLTCENTERS navbar (same markup/classes as main site Navbar).
 * Uses absolute `/…` links so Next basePath does not rewrite main-site routes.
 */
export function SiteNavbar() {
  const { lang, toggleLang } = useGameLang();
  const [open, setOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const t = navCopy[lang];

  const linksBefore: NavLink[] = [
    { label: t.home, path: "/" },
    { label: t.about, path: "/about" },
    { label: t.activities, path: "/activities" },
    { label: t.schedule, path: "/schedule" },
    { label: t.gallery, path: "/gallery" },
  ];

  const linksAfter: NavLink[] = [
    { label: t.register, path: "/register" },
    { label: t.contact, path: "/contact" },
  ];

  const learnActive = true; // always on Millionaire

  const linkClass = (active?: boolean) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
      active
        ? "text-[#0f4c6a] bg-primary/15 font-semibold"
        : "text-foreground/80 hover:text-foreground hover:bg-muted"
    }`;

  const renderLink = (l: NavLink, onNavigate?: () => void) => (
    <a
      key={l.path}
      href={l.path}
      className={linkClass(false)}
      onClick={onNavigate}
    >
      {l.label}
    </a>
  );

  const closeMobile = () => {
    setOpen(false);
    setLearnOpen(false);
  };

  return (
    <nav className="site-navbar sticky top-0 z-50 border-b border-border/50 bg-card/80 shadow-sm backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <a href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-[5px] bg-[#29303d] text-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND_LOGO}
                alt={t.brandLogo}
                width={36}
                height={36}
                className="size-full object-contain"
              />
            </div>
            <span className="hidden text-lg font-bold text-foreground md:inline">
              MLT<span className="text-[#0f4c6a]">CENTERS</span>
            </span>
          </a>

          <a href="/" className="flex shrink-0 items-center gap-2">
            <div className="size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-[#0f4c6a]/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={KRUMAM_AVATAR}
                alt={t.krumam}
                width={36}
                height={36}
                className="size-full object-cover"
              />
            </div>
            <span className="hidden text-lg font-bold text-foreground md:inline">
              krumam <span className="text-[#0f4c6a]">club</span>
            </span>
          </a>
        </div>

        {/* Desktop — same order as main Navbar */}
        <div className="hidden items-center gap-1 lg:flex">
          {linksBefore.map((l) => renderLink(l))}

          <div className="relative">
            <button
              type="button"
              className={`${linkClass(learnActive)} outline-none`}
              onClick={() => setLearnOpen((v) => !v)}
              aria-expanded={learnOpen}
            >
              <Sparkles size={16} className="shrink-0" />
              {t.quizMenu}
              <ChevronDown size={14} className="opacity-70" />
            </button>
            {learnOpen ? (
              <div className="absolute top-full left-0 z-50 mt-1 min-w-[13rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
                <a
                  href="/assessment"
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                  onClick={() => setLearnOpen(false)}
                >
                  <Bot size={16} />
                  {t.assessment}
                </a>
                <a
                  href="/vocab"
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                  onClick={() => setLearnOpen(false)}
                >
                  <BookOpen size={16} />
                  {t.vocab}
                </a>
                <a
                  href={TOEIC_GAME_URL}
                  className="flex cursor-pointer items-center gap-2 rounded-sm bg-primary/15 px-2 py-1.5 text-sm font-semibold text-[#0f4c6a] outline-none"
                  onClick={() => setLearnOpen(false)}
                >
                  <Trophy size={16} />
                  {t.quizBoard}
                </a>
                <a
                  href="/runner-app/"
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                  onClick={() => setLearnOpen(false)}
                >
                  <Gamepad2 size={16} />
                  {t.runner}
                </a>
              </div>
            ) : null}
          </div>

          {linksAfter.map((l) => renderLink(l))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLang}
            aria-label={lang === "en" ? t.switchToTh : t.switchToEn}
            className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Globe size={15} />
            {lang === "en" ? "TH" : "EN"}
          </button>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? t.closeMenu : t.openMenu}
            aria-expanded={open}
            className="p-1 text-foreground lg:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open ? (
        <div className="border-t border-border/50 bg-card/95 backdrop-blur-lg lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {linksBefore.map((l) => renderLink(l, closeMobile))}

            <button
              type="button"
              onClick={() => setLearnOpen((v) => !v)}
              className={`${linkClass(learnActive)} w-full justify-between`}
              aria-expanded={learnOpen}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={16} className="shrink-0" />
                {t.quizMenu}
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform ${learnOpen ? "rotate-180" : ""}`}
              />
            </button>
            {learnOpen ? (
              <div className="ml-4 space-y-1 border-l border-border/60 pl-3">
                <a
                  href="/assessment"
                  onClick={closeMobile}
                  className={linkClass(false)}
                >
                  <Bot size={16} className="shrink-0" />
                  {t.assessment}
                </a>
                <a href="/vocab" onClick={closeMobile} className={linkClass(false)}>
                  <BookOpen size={16} className="shrink-0" />
                  {t.vocab}
                </a>
                <a
                  href={TOEIC_GAME_URL}
                  onClick={closeMobile}
                  className={linkClass(true)}
                >
                  <Trophy size={16} className="shrink-0" />
                  {t.quizBoard}
                </a>
                <a
                  href="/runner-app/"
                  onClick={closeMobile}
                  className={linkClass(false)}
                >
                  <Gamepad2 size={16} className="shrink-0" />
                  {t.runner}
                </a>
              </div>
            ) : null}

            {linksAfter.map((l) => renderLink(l, closeMobile))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
