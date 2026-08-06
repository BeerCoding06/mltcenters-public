"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { cn } from "@/lib/utils";

/** Main-site absolute paths (not Next basePath). */
const SITE = {
  logo: "/logo-nav.png",
  krumam: "/assets/img-design-about/krumam.jpg",
  home: "/",
  about: "/about",
  activities: "/activities",
  schedule: "/schedule",
  gallery: "/gallery",
  register: "/register",
  contact: "/contact",
  assessment: "/assessment",
  vocab: "/vocab",
  runner: "/runner-app/",
} as const;

const copy = {
  en: {
    about: "About",
    activities: "Activities",
    schedule: "Schedule",
    gallery: "Gallery",
    register: "Register",
    contact: "Contact",
    quizMenu: "AI / Vocab",
    assessment: "English chat",
    vocab: "Vocab",
    quizBoard: "TOEIC Millionaire",
    runner: "3D Runner",
    play: "Play",
  },
  th: {
    about: "เกี่ยวกับเรา",
    activities: "กิจกรรม",
    schedule: "ตารางเรียน",
    gallery: "แกลเลอรี",
    register: "สมัครเรียน",
    contact: "ติดต่อ",
    quizMenu: "AI/คำศัพท์",
    assessment: "คุยภาษาอังกฤษ",
    vocab: "ศัพท์",
    quizBoard: "TOEIC เกมส์เศรษฐี",
    runner: "เกมวิ่ง 3D",
    play: "เล่น",
  },
} as const;

function siteLinkClass(active?: boolean) {
  return cn(
    "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-[#5bc0ff]/15 font-semibold text-[#0f4c6a]"
      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
  );
}

/**
 * MLTCENTERS site navbar for the Millionaire app (same-origin links back to main site).
 */
export function SiteNavbar() {
  const { lang, toggleLang, t } = useGameLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const nav = copy[lang];

  const onGame =
    pathname === "/" ||
    pathname.startsWith("/play") ||
    pathname.startsWith("/board") ||
    pathname.startsWith("/login");

  const close = () => {
    setOpen(false);
    setLearnOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 text-zinc-900 shadow-sm backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <a href={SITE.home} className="flex shrink-0 items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-[5px] bg-[#29303d]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SITE.logo}
                alt="MLTCENTERS"
                width={36}
                height={36}
                className="size-full object-contain"
              />
            </div>
            <span className="hidden text-lg font-bold md:inline">
              MLT<span className="text-[#0f4c6a]">CENTERS</span>
            </span>
          </a>
          <a href={SITE.home} className="hidden items-center gap-2 sm:flex">
            <div className="size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-[#0f4c6a]/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SITE.krumam}
                alt="krumam club"
                width={36}
                height={36}
                className="size-full object-cover"
              />
            </div>
            <span className="hidden text-lg font-bold lg:inline">
              krumam <span className="text-[#0f4c6a]">club</span>
            </span>
          </a>
        </div>

        <div className="hidden items-center gap-0.5 lg:flex">
          <a href={SITE.home} className={siteLinkClass()}>
            {t.home}
          </a>
          <a href={SITE.about} className={siteLinkClass()}>
            {nav.about}
          </a>
          <a href={SITE.activities} className={siteLinkClass()}>
            {nav.activities}
          </a>
          <a href={SITE.schedule} className={siteLinkClass()}>
            {nav.schedule}
          </a>
          <a href={SITE.gallery} className={siteLinkClass()}>
            {nav.gallery}
          </a>

          <div className="relative">
            <button
              type="button"
              className={siteLinkClass(onGame)}
              onClick={() => setLearnOpen((v) => !v)}
              aria-expanded={learnOpen}
            >
              <Sparkles size={16} className="shrink-0" />
              {nav.quizMenu}
              <ChevronDown
                size={14}
                className={cn("opacity-70 transition", learnOpen && "rotate-180")}
              />
            </button>
            {learnOpen ? (
              <div className="absolute top-full left-0 z-50 mt-1 min-w-[13rem] rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                <a
                  href={SITE.assessment}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50"
                  onClick={close}
                >
                  <Bot size={16} />
                  {nav.assessment}
                </a>
                <a
                  href={SITE.vocab}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50"
                  onClick={close}
                >
                  <BookOpen size={16} />
                  {nav.vocab}
                </a>
                <Link
                  href="/"
                  className="flex items-center gap-2 bg-[#5bc0ff]/10 px-3 py-2 text-sm font-semibold text-[#0f4c6a]"
                  onClick={close}
                >
                  <Trophy size={16} />
                  {nav.quizBoard}
                </Link>
                <a
                  href={SITE.runner}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50"
                  onClick={close}
                >
                  <Gamepad2 size={16} />
                  {nav.runner}
                </a>
              </div>
            ) : null}
          </div>

          <a href={SITE.register} className={siteLinkClass()}>
            {nav.register}
          </a>
          <a href={SITE.contact} className={siteLinkClass()}>
            {nav.contact}
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/play"
            className="hidden rounded-full border border-[#fbbf24]/60 bg-[#fbbf24] px-3 py-1.5 text-xs font-bold text-black sm:inline-flex"
          >
            {nav.play}
          </Link>
          <button
            type="button"
            onClick={toggleLang}
            aria-label={lang === "en" ? "เปลี่ยนเป็นภาษาไทย" : "Switch to English"}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-[#5bc0ff]/15 hover:text-[#0f4c6a]"
          >
            <Globe size={15} />
            {lang === "en" ? "TH" : "EN"}
          </button>
          <button
            type="button"
            className="rounded-lg p-1.5 text-zinc-800 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-zinc-200 bg-white lg:hidden">
          <div className="space-y-1 px-4 py-3">
            <a href={SITE.home} className={siteLinkClass()} onClick={close}>
              {t.home}
            </a>
            <a href={SITE.about} className={siteLinkClass()} onClick={close}>
              {nav.about}
            </a>
            <a href={SITE.activities} className={siteLinkClass()} onClick={close}>
              {nav.activities}
            </a>
            <a href={SITE.schedule} className={siteLinkClass()} onClick={close}>
              {nav.schedule}
            </a>
            <a href={SITE.gallery} className={siteLinkClass()} onClick={close}>
              {nav.gallery}
            </a>
            <button
              type="button"
              className={`${siteLinkClass(onGame)} w-full justify-between`}
              onClick={() => setLearnOpen((v) => !v)}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={16} />
                {nav.quizMenu}
              </span>
              <ChevronDown
                size={16}
                className={cn(learnOpen && "rotate-180")}
              />
            </button>
            {learnOpen ? (
              <div className="ml-3 space-y-1 border-l border-zinc-200 pl-3">
                <a href={SITE.assessment} className={siteLinkClass()} onClick={close}>
                  <Bot size={16} />
                  {nav.assessment}
                </a>
                <a href={SITE.vocab} className={siteLinkClass()} onClick={close}>
                  <BookOpen size={16} />
                  {nav.vocab}
                </a>
                <Link href="/" className={siteLinkClass(true)} onClick={close}>
                  <Trophy size={16} />
                  {nav.quizBoard}
                </Link>
                <a href={SITE.runner} className={siteLinkClass()} onClick={close}>
                  <Gamepad2 size={16} />
                  {nav.runner}
                </a>
              </div>
            ) : null}
            <a href={SITE.register} className={siteLinkClass()} onClick={close}>
              {nav.register}
            </a>
            <a href={SITE.contact} className={siteLinkClass()} onClick={close}>
              {nav.contact}
            </a>
            <Link
              href="/play"
              className="mt-2 flex justify-center rounded-full bg-[#fbbf24] px-3 py-2 text-sm font-bold text-black"
              onClick={close}
            >
              {nav.play} — {t.brand}
            </Link>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
