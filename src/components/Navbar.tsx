import { useI18n } from '@/lib/i18n';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import treeOnlyLogo from '@/assets/img-design/tree-only.png';

const Navbar = () => {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { label: t.nav.home[lang], path: '/' },
    { label: t.nav.about[lang], path: '/about' },
    { label: t.nav.activities[lang], path: '/activities' },
    { label: t.nav.schedule[lang], path: '/schedule' },
    { label: t.nav.gallery[lang], path: '/gallery' },
    { label: t.nav.assessment[lang], path: '/assessment' },
    { label: t.nav.register[lang], path: '/register' },
    { label: t.nav.contact[lang], path: '/contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 lg:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 flex items-center justify-center text-lg">
            <img
              src={treeOnlyLogo}
              alt="MLTCENTERS"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-lg font-bold text-foreground">
            MLT<span className="text-primary">CENTERS</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === l.path
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "th" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Globe size={15} />
            {lang === "en" ? "TH" : "EN"}
          </button>

          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-foreground p-1"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/50 bg-card/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((l) => (
                <Link
                  key={l.path}
                  to={l.path}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === l.path
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
