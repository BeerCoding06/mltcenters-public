import { useI18n } from '@/lib/i18n';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Globe,
  Bot,
  Gamepad2,
  Trophy,
  BookOpen,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const BRAND_LOGO = '/logo-nav.png';
const KRUMAM_AVATAR = '/assets/img-design-about/krumam.jpg';

const TOEIC_GAME_URL =
  import.meta.env.VITE_TOEIC_GAME_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://toeic.mltcenters.com');

type NavLink = {
  label: string;
  path: string;
  icon?: typeof Bot;
  external?: boolean;
};

const Navbar = () => {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const location = useLocation();

  const linksBefore: NavLink[] = [
    { label: t.nav.home[lang], path: '/' },
    { label: t.nav.about[lang], path: '/about' },
    { label: t.nav.activities[lang], path: '/activities' },
    { label: t.nav.schedule[lang], path: '/schedule' },
    { label: t.nav.gallery[lang], path: '/gallery' },
  ];

  const linksAfter: NavLink[] = [
    { label: t.nav.register[lang], path: '/register' },
    { label: t.nav.contact[lang], path: '/contact' },
  ];

  const learnActive =
    location.pathname === '/assessment' ||
    location.pathname.startsWith('/assessment') ||
    location.pathname === '/vocab' ||
    location.pathname.startsWith('/vocab') ||
    location.pathname.startsWith('/runner-app');

  const linkClass = (path: string, external?: boolean, active?: boolean) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
      active ||
      (!external &&
        (location.pathname === path ||
          (path === '/vocab' && location.pathname.startsWith('/vocab')) ||
          (path === '/assessment' && location.pathname.startsWith('/assessment'))))
        ? 'text-[#0f4c6a] bg-primary/15 font-semibold'
        : 'text-foreground/80 hover:text-foreground hover:bg-muted'
    }`;

  const renderLink = (l: NavLink, onNavigate?: () => void) => {
    const Icon = l.icon ?? null;
    if (l.external) {
      return (
        <a
          key={l.path}
          href={l.path}
          className={linkClass(l.path, true)}
          rel="noopener noreferrer"
          onClick={onNavigate}
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
        className={linkClass(l.path)}
        onClick={onNavigate}
      >
        {Icon && <Icon size={16} className="shrink-0" />}
        {l.label}
      </Link>
    );
  };

  const closeMobile = () => setOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 flex items-center justify-center text-lg bg-[#29303d] rounded-[5px]">
              <img
                src={BRAND_LOGO}
                alt={t.imageAlt.brandLogo[lang]}
                width={36}
                height={36}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="hidden md:inline text-lg font-bold text-foreground">
              MLT<span className="text-[#0f4c6a]">CENTERS</span>
            </span>
          </Link>

          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#0f4c6a]/20 shrink-0">
              <img
                src={KRUMAM_AVATAR}
                alt={t.imageAlt.krumamClub[lang]}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden md:inline text-lg font-bold text-foreground">
              krumam <span className="text-[#0f4c6a]">club</span>
            </span>
          </Link>
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {linksBefore.map((l) => renderLink(l))}

          <DropdownMenu>
            <DropdownMenuTrigger
              className={`${linkClass('/vocab', false, learnActive)} outline-none`}
            >
              <Sparkles size={16} className="shrink-0" />
              {t.nav.quizMenu[lang]}
              <ChevronDown size={14} className="opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[13rem]">
              <DropdownMenuItem asChild>
                <Link to="/assessment" className="flex cursor-pointer items-center gap-2">
                  <Bot size={16} />
                  {t.nav.assessment[lang]}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/vocab" className="flex cursor-pointer items-center gap-2">
                  <BookOpen size={16} />
                  {t.nav.vocab[lang]}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={TOEIC_GAME_URL}
                  rel="noopener noreferrer"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Trophy size={16} />
                  {t.nav.quizBoard[lang]}
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="/runner-app/"
                  rel="noopener noreferrer"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Gamepad2 size={16} />
                  {t.nav.runner[lang]}
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {linksAfter.map((l) => renderLink(l))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
            aria-label={
              lang === 'en' ? 'เปลี่ยนเป็นภาษาไทย' : 'Switch to English'
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Globe size={15} />
            {lang === 'en' ? 'TH' : 'EN'}
          </button>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={
              open
                ? lang === 'en'
                  ? 'Close menu'
                  : 'ปิดเมนู'
                : lang === 'en'
                  ? 'Open menu'
                  : 'เปิดเมนู'
            }
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
            {linksBefore.map((l) => renderLink(l, closeMobile))}

            <button
              type="button"
              onClick={() => setLearnOpen((v) => !v)}
              className={`${linkClass('/vocab', false, learnActive)} w-full justify-between`}
              aria-expanded={learnOpen}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={16} className="shrink-0" />
                {t.nav.quizMenu[lang]}
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform ${learnOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {learnOpen && (
              <div className="ml-4 space-y-1 border-l border-border/60 pl-3">
                <Link
                  to="/assessment"
                  onClick={closeMobile}
                  className={linkClass('/assessment')}
                >
                  <Bot size={16} className="shrink-0" />
                  {t.nav.assessment[lang]}
                </Link>
                <Link
                  to="/vocab"
                  onClick={closeMobile}
                  className={linkClass('/vocab')}
                >
                  <BookOpen size={16} className="shrink-0" />
                  {t.nav.vocab[lang]}
                </Link>
                <a
                  href={TOEIC_GAME_URL}
                  rel="noopener noreferrer"
                  onClick={closeMobile}
                  className={linkClass(TOEIC_GAME_URL, true)}
                >
                  <Trophy size={16} className="shrink-0" />
                  {t.nav.quizBoard[lang]}
                </a>
                <a
                  href="/runner-app/"
                  rel="noopener noreferrer"
                  onClick={closeMobile}
                  className={linkClass('/runner-app/', true)}
                >
                  <Gamepad2 size={16} className="shrink-0" />
                  {t.nav.runner[lang]}
                </a>
              </div>
            )}

            {linksAfter.map((l) => renderLink(l, closeMobile))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
