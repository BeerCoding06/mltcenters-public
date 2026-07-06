import { useState } from 'react';
import { Menu, X, Globe, Bot, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavI18n } from '../lib/nav-i18n';

const RUNNER_PATH = '/runner-app/';

function isActive(path: string, currentPath: string) {
  if (path === RUNNER_PATH) {
    return currentPath.startsWith('/runner-app');
  }
  return currentPath === path || (path !== '/' && currentPath.startsWith(path));
}

export function GameNavbar() {
  const { lang, setLang, nav: t } = useNavI18n();
  const [open, setOpen] = useState(false);
  const currentPath =
    typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') || '/' : RUNNER_PATH;

  const links: Array<{
    label: string;
    path: string;
    icon?: typeof Bot;
  }> = [
    { label: t.home[lang], path: '/' },
    { label: t.about[lang], path: '/about' },
    { label: t.activities[lang], path: '/activities' },
    { label: t.schedule[lang], path: '/schedule' },
    { label: t.gallery[lang], path: '/gallery' },
    { label: t.assessment[lang], path: '/assessment', icon: Bot },
    { label: t.runner[lang], path: RUNNER_PATH, icon: Gamepad2 },
    { label: t.register[lang], path: '/register' },
    { label: t.contact[lang], path: '/contact' },
  ];

  const linkClass = (path: string) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
      isActive(path, currentPath)
        ? 'text-primary bg-primary/10'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 lg:px-6">
        <a href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 flex items-center justify-center text-lg bg-[#29303d] rounded-[5px]">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="MLTCENTERS"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-lg font-bold text-foreground">
            MLT<span className="text-primary">CENTERS</span>
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => {
            const Icon = l.icon ?? null;
            return (
              <a key={l.path} href={l.path} className={linkClass(l.path)}>
                {Icon && <Icon size={16} className="shrink-0" />}
                {l.label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Globe size={15} />
            {lang === 'en' ? 'TH' : 'EN'}
          </button>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="lg:hidden text-foreground p-1"
            aria-label="เมนู"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/50 bg-card/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((l) => {
                const Icon = l.icon ?? null;
                return (
                  <a
                    key={l.path}
                    href={l.path}
                    onClick={() => setOpen(false)}
                    className={linkClass(l.path)}
                  >
                    {Icon && <Icon size={16} className="shrink-0" />}
                    {l.label}
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
