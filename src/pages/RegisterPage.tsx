import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import brandLogo from '@/assets/img-design/tree-only.png';

const RegisterPage = () => {
  const { lang, t } = useI18n();
  const [form, setForm] = useState({ name: '', school: '', grade: '', phone: '', email: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(lang === 'en' ? 'Registration submitted!' : 'ลงทะเบียนสำเร็จ!');
    setForm({ name: '', school: '', grade: '', phone: '', email: '' });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <div className="relative py-16 min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.14] pointer-events-none" aria-hidden>
          <img src={brandLogo} alt="" className="w-[min(100%,28rem)] object-contain" />
        </div>
        <div className="absolute inset-0 bg-background/88" />
      </div>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <h1 className="text-4xl md:text-5xl md:!leading-[1.3] font-bold gradient-text-pastel text-center mb-3">
            {t.registerPage.title[lang]}
          </h1>
          <p className="text-center text-muted-foreground mb-10">
            {t.registerPage.cta[lang]}
          </p>

          <form onSubmit={handleSubmit} className="pastel-card p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.registerPage.name[lang]}</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.registerPage.school[lang]}</label>
              <input required value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.registerPage.grade[lang]}</label>
              <select required value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className={inputClass}>
                <option value="">—</option>
                {t.registerPage.gradeOptions.map((opt, i) => (
                  <option key={i} value={opt.en}>{opt[lang]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.registerPage.phone[lang]}</label>
              <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.registerPage.email[lang]}</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>

            <button type="submit" className="w-full gradient-btn py-4 text-lg mt-2">
              {t.registerPage.submit[lang]}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
