import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import registerBg from '@/assets/hero-pastel.jpg';

const RegisterPage = () => {
  const { lang, t } = useI18n();
  const [form, setForm] = useState({ name: '', school: '', grade: '', phone: '', email: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(lang === 'en' ? 'Registration submitted!' : 'ลงทะเบียนสำเร็จ!');
    setForm({ name: '', school: '', grade: '', phone: '', email: '' });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  const registerBgAlt = lang === 'en' ? 'Soft background for registration' : 'พื้นหลังหน้าการลงทะเบียน';

  return (
    <div className="relative py-16 min-h-screen overflow-hidden">
      {/* Soft background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={registerBg}
          alt={registerBgAlt}
          className="w-full h-full object-cover object-center img-pastel-tone"
        />
        <div className="absolute inset-0 img-pastel-overlay" />
        <div className="absolute inset-0 bg-background/85" />
      </div>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text-pastel text-center mb-3">
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
