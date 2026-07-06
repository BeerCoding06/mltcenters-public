import { useState } from "react";
import { th } from "../lib/i18n";

const LINKS = [
  { label: th.nav.home, href: "/" },
  { label: th.nav.about, href: "/about" },
  { label: th.nav.activities, href: "/activities" },
  { label: th.nav.schedule, href: "/schedule" },
  { label: th.nav.gallery, href: "/gallery" },
  { label: th.nav.assessment, href: "/assessment" },
  { label: th.nav.runner, href: "/runner-app/", current: true },
  { label: th.nav.register, href: "/register" },
  { label: th.nav.contact, href: "/contact" },
] as const;

export function GameNavbar() {
  const [open, setOpen] = useState(false);

  const linkClass = (current?: boolean) =>
    `block rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
      current
        ? "bg-violet-500/20 text-violet-200"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <nav className="sticky top-0 z-50 shrink-0 border-b border-slate-700/60 bg-slate-950/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <a href="/" className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#29303d]">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MLTCENTERS" className="h-full w-full object-contain" />
          </div>
          <span className="truncate text-base font-bold text-white sm:text-lg">
            MLT<span className="text-violet-400">CENTERS</span>
          </span>
        </a>

        <div className="hidden items-center gap-0.5 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={linkClass("current" in l && l.current)}>
              {l.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
          aria-label="เมนู"
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-700/60 bg-slate-950/95 px-3 py-2 lg:hidden">
          <div className="grid gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={linkClass("current" in l && l.current)}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
