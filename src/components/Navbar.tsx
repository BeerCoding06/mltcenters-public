import { useI18n } from '@/lib/i18n';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe, Bot, Gamepad2 } from 'lucide-react';

const BRAND_LOGO = '/logo-nav.png';

const Navbar = () => {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links: Array<{
    label: string;
    path: string;
    icon?: typeof Bot;
    external?: boolean;
  }> = [
    { label: t.nav.home[lang], path: '/' },
    { label: t.nav.about[lang], path: '/about' },
    { label: t.nav.activities[lang], path: '/activities' },
    { label: t.nav.schedule[lang], path: '/schedule' },
    { label: t.nav.gallery[lang], path: '/gallery' },
    { label: t.nav.assessment[lang], path: '/assessment', icon: Bot },
    { label: t.nav.runner[lang], path: '/runner-app/', icon: Gamepad2, external: true },
    { label: t.nav.register[lang], path: '/register' },
    { label: t.nav.contact[lang], path: '/contact' },
  ];

  const linkClass = (path: string, external?: boolean) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
      !external && location.pathname === path
        ? 'text-[#0f4c6a] bg-primary/15 font-semibold'
        : 'text-foreground/80 hover:text-foreground hover:bg-muted'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 lg:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 flex items-center justify-center text-lg bg-[#29303d] rounded-[5px]">
            <img
              src={BRAND_LOGO}
              alt=""
              width={36}
              height={36}
              className="w-full h-full object-contain"
            />
          </div>
              <span className="text-lg font-bold text-foreground">
                MLT<span className="text-[#0f4c6a]">CENTERS</span>
              </span>
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => {
            const Icon = l.icon ?? null;
            if (l.external) {
              return (
                <a key={l.path} href={l.path} className={linkClass(l.path, true)} rel="noopener noreferrer">
                  {Icon && <Icon size={16} className="shrink-0" />}
                  {l.label}
                </a>
              );
            }
            return (
            <Link
              key={l.path}
              to={l.path}
              className={linkClass(l.path)}
            >
              {Icon && <Icon size={16} className="shrink-0" />}
              {l.label}
            </Link>
          );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "th" : "en")}
            aria-label={lang === "en" ? "เปลี่ยนเป็นภาษาไทย" : "Switch to English"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Globe size={15} />
            {lang === "en" ? "TH" : "EN"}
          </button>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? (lang === "en" ? "Close menu" : "ปิดเมนู") : (lang === "en" ? "Open menu" : "เปิดเมนู")}
            aria-expanded={open}
            className="lg:hidden text-foreground p-1"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border/50 bg-card/95 backdrop-blur-lg">
          <div className="px-4 py-3 space-y-1">
            {links.map((l) => {
              const Icon = l.icon ?? null;
              if (l.external) {
                return (
                  <a
                    key={l.path}
                    href={l.path}
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className={linkClass(l.path, true)}
                  >
                    {Icon && <Icon size={16} className="shrink-0" />}
                    {l.label}
                  </a>
                );
              }
              return (
                <Link
                  key={l.path}
                  to={l.path}
                  onClick={() => setOpen(false)}
                  className={linkClass(l.path)}
                >
                  {Icon && <Icon size={16} className="shrink-0" />}
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
