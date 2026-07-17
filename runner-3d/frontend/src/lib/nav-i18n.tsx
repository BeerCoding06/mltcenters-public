import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Lang = 'en' | 'th';

const nav = {
  home: { en: 'Home', th: 'หน้าแรก' },
  about: { en: 'About', th: 'เกี่ยวกับเรา' },
  activities: { en: 'Activities', th: 'กิจกรรม' },
  schedule: { en: 'Schedule', th: 'กำหนดการ' },
  gallery: { en: 'Gallery', th: 'แกลเลอรี' },
  register: { en: 'Register', th: 'ลงทะเบียน' },
  contact: { en: 'Contact', th: 'ติดต่อ' },
  assessment: { en: 'Chat English', th: 'คุยภาษาอังกฤษ' },
  runner: { en: '3D Runner Game', th: 'เกมวิ่ง 3D' },
  brandLogo: {
    en: 'MLTCENTERS logo — English language learning 3D runner game',
    th: 'โลโก้ MLTCENTERS — เกมวิ่ง 3D เรียนภาษาอังกฤษ',
  },
} as const;

const NavI18nContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  nav: typeof nav;
} | null>(null);

export function NavI18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem('lang');
      return stored === 'en' || stored === 'th' ? stored : 'th';
    } catch {
      return 'th';
    }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('lang', l);
    } catch {
      /* ignore */
    }
  };

  return (
    <NavI18nContext.Provider value={{ lang, setLang, nav }}>
      {children}
    </NavI18nContext.Provider>
  );
}

export function useNavI18n() {
  const ctx = useContext(NavI18nContext);
  if (!ctx) throw new Error('useNavI18n must be used within NavI18nProvider');
  return ctx;
}
