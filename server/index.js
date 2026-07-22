/**
 * Backend: OpenAI assessment proxy + registration email.
 * Run: npm install && OPENAI_API_KEY=sk-... npm start
 * Registration email (PHPMailer via PHP — recommended on MAMP):
 *   USE_PHP_MAILER=true
 *   MAIL_SMTP_USER=paradon.pokpingmaung@gmail.com
 *   MAIL_SMTP_PASS=your-gmail-app-password
 *   REGISTER_TO_EMAIL=paradon.pokpingmaung@gmail.com,mltcenterth@gmail.com
 *   Run: cd mail && composer install
 */
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';
import compression from 'compression';
import { createRunnerRouter } from './runner-api.js';
import { isPhpMailerReady, sendViaPhpMailer } from './php-mailer.js';
import {
  buildAssessApiMessages,
  buildRewriteInstruction,
  getPreviousAssistantReply,
  handleIncompleteUserMessage,
  isSubstantiallySimilar,
  logAssessDebug,
  logAssessPrompt,
  parseAssessResponse,
  postProcessReply,
} from './conversation.js';
import {
  getMetaForPath,
  injectSeoMeta,
  isKnownSpaPath,
} from './seo-meta.js';
import { createAnalyticsRouter } from './analytics/analytics-router.js';
import { initAnalyticsDb } from './analytics/db.js';
import {
  initVocabDb,
  getVocabDbMode,
  getVocabFileStore,
  getVocabPgPool,
} from './vocab/db.js';
import { createVocabRouter } from './vocab/router.js';
import { createVocabModel } from './vocab/model.js';
import { createVocabService } from './vocab/service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const REGISTER_TO_EMAILS = (process.env.REGISTER_TO_EMAIL ||
  'paradon.pokpingmaung@gmail.com,mltcenterth@gmail.com')
  .split(/[\s,;]+/)
  .map((s) => s.trim())
  .filter(Boolean);
const MAIL_SMTP_USER = process.env.MAIL_SMTP_USER || process.env.SMTP_USER || '';
const MAIL_SMTP_PASS = process.env.MAIL_SMTP_PASS || process.env.SMTP_PASS || '';
const MAIL_SMTP_FROM = process.env.MAIL_SMTP_FROM || MAIL_SMTP_USER;
const USE_PHP_MAILER =
  process.env.USE_PHP_MAILER !== 'false' &&
  process.env.USE_PHP_MAILER !== '0';
const PHP_MAILER_READY = USE_PHP_MAILER && isPhpMailerReady();
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'MLTCENTERS <onboarding@resend.dev>';
const USE_GMAIL_SERVICE = !process.env.SMTP_HOST;

const app = express();
app.disable('x-powered-by');
app.use(compression());

// Redirect bare domain to www (works when traffic reaches this server)
app.use((req, res, next) => {
  const host = (req.get('x-forwarded-host') || req.get('host') || '').split(':')[0].toLowerCase();
  if (host === 'mltcenters.com') {
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    return res.redirect(301, `${proto}://www.mltcenters.com${req.originalUrl}`);
  }
  next();
});

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  if (req.secure || req.get('x-forwarded-proto') === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});
app.use(cors({ origin: true }));
app.use(express.json({ limit: '256kb' }));
app.use('/api/analytics', createAnalyticsRouter());

const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
const AI_BASE_URL = process.env.OPENAI_BASE_URL || process.env.AI_GATEWAY_BASE_URL;
const AI_MODEL =
  process.env.OPENAI_MODEL || process.env.AI_MODEL || process.env.AI_GATEWAY_MODEL || 'gpt-4o-mini';

const openai = AI_API_KEY
  ? new OpenAI({
      apiKey: AI_API_KEY,
      ...(AI_BASE_URL ? { baseURL: AI_BASE_URL } : {}),
    })
  : null;

const VOCAB_ENABLED =
  process.env.VOCAB_ENABLED !== 'false' && process.env.VOCAB_ENABLED !== '0';

const mailTransport =
  SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport(
        USE_GMAIL_SERVICE
          ? {
              service: 'gmail',
              auth: { user: SMTP_USER, pass: SMTP_PASS },
            }
          : {
              host: SMTP_HOST,
              port: SMTP_PORT,
              secure: SMTP_PORT === 465,
              auth: { user: SMTP_USER, pass: SMTP_PASS },
            }
      )
    : null;

const REGISTER_FIELDS = [
  'firstName',
  'lastName',
  'nickname',
  'company',
  'position',
  'educationLevel',
  'phone',
  'lineId',
  'email',
];

const FIELD_LABELS = {
  firstName: 'First Name',
  lastName: 'Last Name',
  nickname: 'Nickname',
  company: 'Company',
  position: 'Position',
  educationLevel: 'Education Level',
  phone: 'Phone',
  lineId: 'Line ID',
  email: 'Email',
};

function buildRegistrationEmail(body) {
  const lines = REGISTER_FIELDS.map((key) => `${FIELD_LABELS[key]}: ${body[key] ?? ''}`);
  const text = ['New MLTCENTERS Workshop Registration', '', ...lines, '', `Submitted at: ${new Date().toISOString()}`].join('\n');
  const html = `
    <h2>New MLTCENTERS Workshop Registration</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      ${REGISTER_FIELDS.map(
        (key) =>
          `<tr><td style="font-weight:600;padding-right:12px;">${FIELD_LABELS[key]}</td><td>${String(body[key] ?? '').replace(/</g, '&lt;')}</td></tr>`
      ).join('')}
    </table>
    <p style="color:#666;margin-top:16px;">Submitted at: ${new Date().toISOString()}</p>
  `;
  return { text, html };
}

const emailConfigured = Boolean(
  (PHP_MAILER_READY && MAIL_SMTP_USER && MAIL_SMTP_PASS) ||
    RESEND_API_KEY ||
    (SMTP_USER && SMTP_PASS && mailTransport)
);

async function sendRegistrationEmail({ replyTo, subject, text, html }) {
  if (PHP_MAILER_READY && MAIL_SMTP_USER && MAIL_SMTP_PASS) {
    await sendViaPhpMailer({ replyTo, subject, text, html });
    return;
  }

  if (RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: REGISTER_TO_EMAILS,
        reply_to: replyTo,
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Resend failed (${res.status})`);
    }
    return;
  }

  if (!mailTransport) {
    throw new Error('Email not configured');
  }

  await mailTransport.sendMail({
    from: SMTP_FROM,
    to: REGISTER_TO_EMAILS,
    replyTo,
    subject,
    text,
    html,
  });
}

app.post('/api/register', async (req, res) => {
  if (!emailConfigured) {
    return res.status(503).json({
      error:
        'Email is not configured. Set MAIL_SMTP_USER + MAIL_SMTP_PASS and run cd mail && composer install, or set RESEND_API_KEY.',
      errorTh:
        'ยังไม่ได้ตั้งค่าอีเมล กรุณาใส่ MAIL_SMTP_USER + MAIL_SMTP_PASS ใน .env และรัน cd mail && composer install',
    });
  }

  const body = req.body || {};
  const missing = REGISTER_FIELDS.filter((key) => !String(body[key] ?? '').trim());
  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  }

  const email = String(body.email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const payload = Object.fromEntries(
    REGISTER_FIELDS.map((key) => [key, String(body[key]).trim()])
  );

  const { text, html } = buildRegistrationEmail(payload);

  try {
    await sendRegistrationEmail({
      replyTo: email,
      subject: `[MLTCENTERS] Registration – ${payload.firstName} ${payload.lastName}`,
      text,
      html,
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Registration email failed:', err);
    const message = err.message || 'Failed to send registration email.';
    const authFailed =
      /authenticate|app password|gmail smtp authentication/i.test(message);
    return res.status(500).json({
      error: message,
      errorTh: authFailed
        ? 'Gmail ปฏิเสธการ login — ต้องใช้ App Password 16 หลัก (ไม่ใช่รหัสเข้า Gmail ปกติ) ที่ Google Account → Security → App passwords'
        : 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    });
  }
});

async function createAssessCompletion(openaiClient, apiMessages, options = {}) {
  return openaiClient.chat.completions.create({
    model: AI_MODEL,
    messages: apiMessages,
    max_tokens: 220,
    temperature: options.temperature ?? 0.65,
    frequency_penalty: 0.55,
    presence_penalty: 0.4,
  });
}

app.post('/api/assess', async (req, res) => {
  if (!openai) {
    return res.status(503).json({
      error: 'AI API key not configured. Set OPENAI_API_KEY or AI_GATEWAY_API_KEY.',
    });
  }
  const { messages, speech_context, scenario, greeting_already_spoken } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Body must include messages array.' });
  }

  try {
    const { apiMessages, history, latestUser } = buildAssessApiMessages({
      messages,
      scenario,
      speechContext: speech_context,
      greetingAlreadySpoken: greeting_already_spoken,
    });

    logAssessDebug('final transcript', speech_context?.raw || latestUser);
    logAssessDebug('retrieved conversation history', history);

    const incomplete = handleIncompleteUserMessage(latestUser);
    if (incomplete.handled) {
      logAssessDebug(
        incomplete.ignore ? 'ignored filler transcript' : 'incomplete transcript → continue prompt',
        latestUser
      );
      return res.json({
        reply: incomplete.reply,
        ignored: Boolean(incomplete.ignore),
        scores: null,
        level: null,
      });
    }

    logAssessPrompt(apiMessages);

    let completion = await createAssessCompletion(openai, apiMessages);
    let parsed = parseAssessResponse(completion.choices[0]?.message?.content?.trim() || '');

    const priorAssistant = getPreviousAssistantReply(history);
    parsed.reply = postProcessReply(parsed.reply, priorAssistant);

    if (priorAssistant && isSubstantiallySimilar(parsed.reply, priorAssistant)) {
      const retryMessages = [
        ...apiMessages,
        { role: 'system', content: buildRewriteInstruction(priorAssistant, latestUser) },
      ];
      logAssessPrompt(retryMessages);
      completion = await createAssessCompletion(openai, retryMessages, { temperature: 0.85 });
      parsed = parseAssessResponse(completion.choices[0]?.message?.content?.trim() || '');
      parsed.reply = postProcessReply(parsed.reply, priorAssistant);
    }

    logAssessDebug('final response', parsed.reply);
    return res.json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'OpenAI request failed' });
  }
});

// 3D English Runner game API
app.use('/runner-api', createRunnerRouter(openai, AI_MODEL));

const runnerAppPath = path.join(distPath, 'runner-app');
const indexHtmlPath = path.join(distPath, 'index.html');
const runnerIndexHtmlPath = path.join(runnerAppPath, 'index.html');

let indexHtmlTemplate = '';
let runnerIndexHtmlTemplate = '';
/** @type {Map<string, string>} */
const injectedHtmlCache = new Map();

if (existsSync(indexHtmlPath)) {
  indexHtmlTemplate = readFileSync(indexHtmlPath, 'utf8');
}
if (existsSync(runnerIndexHtmlPath)) {
  runnerIndexHtmlTemplate = readFileSync(runnerIndexHtmlPath, 'utf8');
}

function getInjectedHtml(template, pathname) {
  const meta = getMetaForPath(pathname);
  const cacheKey = `${pathname}|${meta.title}|${meta.notFound ? '404' : 'ok'}`;
  const cached = injectedHtmlCache.get(cacheKey);
  if (cached) return cached;
  const html = injectSeoMeta(template, meta);
  injectedHtmlCache.set(cacheKey, html);
  return html;
}

function sendSpaHtml(req, res, template, pathname) {
  const meta = getMetaForPath(pathname);
  const is404 = meta.notFound || !isKnownSpaPath(pathname);

  if (is404) {
    res.status(404);
  }

  if (template && meta.title) {
    res.type('html').send(getInjectedHtml(template, pathname));
    return;
  }

  res.sendFile(pathname.startsWith('/runner-app') ? runnerIndexHtmlPath : indexHtmlPath);
}

if (existsSync(distPath)) {
  if (existsSync(runnerAppPath)) {
    app.use('/runner-app', express.static(runnerAppPath));
    app.get('/runner-app/*', (req, res) => {
      if (existsSync(runnerIndexHtmlPath)) {
        sendSpaHtml(req, res, runnerIndexHtmlTemplate, req.path);
      } else {
        res.status(503).send('Runner game is not deployed yet. Please redeploy the application.');
      }
    });
  }
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/runner-api') ||
      req.path.startsWith('/runner-app')
    ) {
      return next();
    }
    // Never serve SPA shell for static/agent files (llms.txt, sw.js, sitemap, etc.)
    if (/\.(txt|xml|json|js|webmanifest|png|jpe?g|webp|ico|svg|woff2?|css)$/i.test(req.path)) {
      return next();
    }
    if (!existsSync(indexHtmlPath)) return next();
    sendSpaHtml(req, res, indexHtmlTemplate, req.path);
  });

  // Fallback when runner-app bundle missing
  app.get('/runner-app/*', (_req, res) => {
    if (existsSync(runnerIndexHtmlPath)) {
      return res.sendFile(runnerIndexHtmlPath);
    }
    res.status(503).send('Runner game is not deployed yet. Please redeploy the application.');
  });
}

const PORT = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

Promise.all([
  initAnalyticsDb().catch((err) => {
    console.error('[analytics] failed to init database:', err);
  }),
  VOCAB_ENABLED
    ? initVocabDb().catch((err) => {
        console.error('[vocab] failed to init database:', err);
      })
    : Promise.resolve(),
]).finally(() => {
    if (VOCAB_ENABLED && getVocabDbMode() !== 'none') {
      const model = createVocabModel({
        mode: getVocabDbMode(),
        fileStore: getVocabFileStore(),
        pgPool: getVocabPgPool(),
      });
      const vocabService = createVocabService({
        model,
        openai,
        modelName: AI_MODEL,
      });
      app.use('/api/vocab', createVocabRouter({ service: vocabService }));
      console.info('[vocab] routes mounted at /api/vocab');
    }

    app.listen(PORT, host, () => {
      console.log(`Server listening on http://${host}:${PORT}`);
      if (openai) {
        console.log(
          `AI ready: model=${AI_MODEL}${AI_BASE_URL ? ` base=${AI_BASE_URL}` : ' (OpenAI default)'}`
        );
      } else {
        console.warn('AI disabled: set OPENAI_API_KEY or AI_GATEWAY_API_KEY');
      }
      if (mailTransport) {
        mailTransport
          .verify()
          .then(() => console.log(`Registration email (SMTP) → ${REGISTER_TO_EMAILS.join(', ')}`))
          .catch((err) => console.error('SMTP verify failed:', err.message));
      } else if (PHP_MAILER_READY && MAIL_SMTP_USER && MAIL_SMTP_PASS) {
        console.log(
          `Registration email (PHPMailer via ${MAIL_SMTP_FROM}) → ${REGISTER_TO_EMAILS.join(', ')}`
        );
      } else if (RESEND_API_KEY) {
        console.log(`Registration email (Resend) → ${REGISTER_TO_EMAILS.join(', ')}`);
      } else {
        console.warn(
          'Registration email disabled: set RESEND_API_KEY or SMTP_USER + SMTP_PASS in .env'
        );
      }
    });
  });
