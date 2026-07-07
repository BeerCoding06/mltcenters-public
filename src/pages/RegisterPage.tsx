import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

const BRAND_LOGO = '/logo-nav.png';

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

type FormField = keyof typeof emptyForm;

const fieldIds: Record<FormField, string> = {
  firstName: 'register-first-name',
  lastName: 'register-last-name',
  nickname: 'register-nickname',
  company: 'register-company',
  position: 'register-position',
  educationLevel: 'register-education',
  phone: 'register-phone',
  lineId: 'register-line',
  email: 'register-email',
};

const RegisterPage = () => {
  const { lang, t } = useI18n();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: FormField, value: string) => {
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
        const msg =
          lang === 'th' && data.errorTh
            ? data.errorTh
            : data.error || t.registerPage.error[lang];
        throw new Error(msg);
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

  const Field = ({
    field,
    label,
    type = 'text',
    required = true,
    children,
  }: {
    field?: FormField;
    label: string;
    type?: string;
    required?: boolean;
    children?: React.ReactNode;
  }) => {
    const id = field ? fieldIds[field] : undefined;
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
        {children ??
          (field ? (
            <input
              id={id}
              type={type}
              required={required}
              value={form[field]}
              onChange={(e) => update(field, e.target.value)}
              className={inputClass}
            />
          ) : null)}
      </div>
    );
  };

  return (
    <div className="relative py-16 min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.14] pointer-events-none" aria-hidden>
          <img src={BRAND_LOGO} alt="" width={448} height={448} className="w-[min(100%,28rem)] object-contain" />
        </div>
        <div className="absolute inset-0 bg-background/88" />
      </div>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl md:!leading-[1.3] font-bold heading-gradient text-center mb-3">
            {t.registerPage.title[lang]}
          </h1>
          <p className="text-center text-muted-foreground mb-10">
            {t.registerPage.cta[lang]}
          </p>

          <form onSubmit={handleSubmit} className="pastel-card p-8 space-y-5" noValidate={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field field="firstName" label={t.registerPage.firstName[lang]} />
              <Field field="lastName" label={t.registerPage.lastName[lang]} />
            </div>

            <Field field="nickname" label={t.registerPage.nickname[lang]} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field field="company" label={t.registerPage.company[lang]} />
              <Field field="position" label={t.registerPage.position[lang]} />
            </div>

            <Field label={t.registerPage.educationLevel[lang]}>
              <select
                id={fieldIds.educationLevel}
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
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field field="phone" type="tel" label={t.registerPage.phone[lang]} />
              <Field field="lineId" label={t.registerPage.lineId[lang]} />
            </div>

            <Field field="email" type="email" label={t.registerPage.email[lang]} />

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
