import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import brandLogo from '@/assets/logo-new.png';

const emptyForm = {
  firstName: '',
  lastName: '',
  nickname: '',
  company: '',
  position: '',
  educationLevel: '',
  phone: '',
  lineId: '',
  email: '',
};

const RegisterPage = () => {
  const { lang, t } = useI18n();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || t.registerPage.error[lang]);
      }
      toast.success(t.registerPage.success[lang]);
      setForm(emptyForm);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.registerPage.error[lang]);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all';

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
          className="max-w-xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl md:!leading-[1.3] font-bold gradient-text-pastel text-center mb-3">
            {t.registerPage.title[lang]}
          </h1>
          <p className="text-center text-muted-foreground mb-10">
            {t.registerPage.cta[lang]}
          </p>

          <form onSubmit={handleSubmit} className="pastel-card p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t.registerPage.firstName[lang]}
                </label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t.registerPage.lastName[lang]}
                </label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t.registerPage.nickname[lang]}
              </label>
              <input
                required
                value={form.nickname}
                onChange={(e) => update('nickname', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t.registerPage.company[lang]}
                </label>
                <input
                  required
                  value={form.company}
                  onChange={(e) => update('company', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t.registerPage.position[lang]}
                </label>
                <input
                  required
                  value={form.position}
                  onChange={(e) => update('position', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t.registerPage.educationLevel[lang]}
              </label>
              <select
                required
                value={form.educationLevel}
                onChange={(e) => update('educationLevel', e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {t.registerPage.educationOptions.map((opt, i) => (
                  <option key={i} value={opt.en}>
                    {opt[lang]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t.registerPage.phone[lang]}
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t.registerPage.lineId[lang]}
                </label>
                <input
                  required
                  value={form.lineId}
                  onChange={(e) => update('lineId', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t.registerPage.email[lang]}
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className={inputClass}
              />
            </div>

            <button type="submit" disabled={submitting} className="w-full gradient-btn py-4 text-lg mt-2 disabled:opacity-60">
              {submitting ? t.registerPage.submitting[lang] : t.registerPage.submit[lang]}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
