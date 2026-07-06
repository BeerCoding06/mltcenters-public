/**
 * Backend: OpenAI assessment proxy + registration email.
 * Run: npm install && OPENAI_API_KEY=sk-... npm start
 * Registration email (set on server):
 *   REGISTER_TO_EMAIL=mltcenterth@gmail.com
 *   SMTP_HOST=smtp.gmail.com  SMTP_PORT=587
 *   SMTP_USER=your@gmail.com  SMTP_PASS=app-password
 */
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';
import { createRunnerRouter } from './runner-api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const REGISTER_TO_EMAIL = process.env.REGISTER_TO_EMAIL || 'mltcenterth@gmail.com';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'MLTCENTERS <onboarding@resend.dev>';
const USE_GMAIL_SERVICE = !process.env.SMTP_HOST;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

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

const emailConfigured = Boolean(RESEND_API_KEY || (SMTP_USER && SMTP_PASS));

async function sendRegistrationEmail({ replyTo, subject, text, html }) {
  if (RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [REGISTER_TO_EMAIL],
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
    to: REGISTER_TO_EMAIL,
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
        'Email is not configured. Set RESEND_API_KEY or SMTP_USER + SMTP_PASS in .env.',
      errorTh:
        'ยังไม่ได้ตั้งค่าอีเมล กรุณาใส่ RESEND_API_KEY หรือ SMTP_USER + SMTP_PASS ในไฟล์ .env',
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
    return res.status(500).json({ error: err.message || 'Failed to send registration email.' });
  }
});

const SYSTEM_PROMPT = `You are a warm, gentle English friend for young Thai children.

Rules for the "reply" field (read aloud slowly by text-to-speech):
- Use simple English only in "reply" — never use Thai in the reply
- Younger kids: very short (3-6 words per sentence). Older kids: still simple, a bit longer OK
- Speak like a kind teacher: slow, clear, happy, encouraging
- Topics: colors, animals, family, food, numbers, school, hobbies, friends, games, daily life
- Ask ONE easy question per turn
- Never test hard grammar. Never mention JSON or scores in the reply
- Use punctuation that creates pauses: commas and periods between short phrases

Unclear speech (IMPORTANT):
- The user message is the child's EXACT spoken words from the microphone — never rewrite or replace their words.
- You may receive alternative speech-recognition guesses in a separate note. Use those ONLY to understand unclear parts.
- Respond accurately to what the child said or clearly meant. Do not substitute different words for what they said.
- If audio was unclear, respond to the most likely meaning — but stay faithful to their message (e.g. if they said "ba", talk about "ba" or gently ask if they meant "ball").
- Never say harshly that you did not understand — gently clarify or offer two simple choices.

After each user message, respond with ONLY valid JSON (no markdown):
{"reply": "...", "scores": {"grammar": 0-100, "vocabulary": 0-100, "fluency": 0-100, "coherence": 0-100}, "level": "Beginner"|"Intermediate"|"Advanced"}

Scores: be generous with young kids; adjust up slightly if they speak in full sentences.
Include scores on every turn after the user's first message. On the very first assistant turn (greeting only), scores may be null.`;

const SCENARIO_PROMPTS = {
  free_talk:
    'Situation: free talk. Chat naturally about hobbies, favorites, and daily life. Stay in character as a warm friend.',
  school:
    'Situation: at school. Role-play a kind teacher. Talk about class, friends, subjects, recess, and lunch. Use simple school words.',
  restaurant:
    'Situation: at a restaurant. Role-play ordering food and drinks. Be polite. Use menu words like soup, rice, juice, please, thank you.',
  park:
    'Situation: at the park. Role-play outdoor fun — swings, running, birds, sunshine. Keep it playful and active.',
  shopping:
    'Situation: at a shop. Role-play buying things. Ask what they want, colors, and simple prices.',
  home:
    'Situation: at home. Role-play family time — meals, pets, toys, bedtime, helping mom or dad.',
  making_friends:
    'Situation: meeting a new friend. Practice greetings, sharing, and kind getting-to-know-you questions.',
  doctor:
    'Situation: at the doctor. Role-play gently. Ask how they feel. Use simple body words. Stay calm and reassuring — never scary.',
  hotel_booking:
    'Situation: hotel front desk. Role-play booking a room. Use simple words: room, night, name, key, check-in. Be polite like a hotel receptionist.',
  getting_lost:
    'Situation: the student is lost. Role-play a kind helper. Ask where they want to go. Use direction words: left, right, straight, near, far. Stay calm.',
  asking_directions:
    'Situation: a visitor asks the student for directions. You are the visitor who is a little lost. Ask where places are. Let the student practice telling you the way in simple English.',
};

app.post('/api/assess', async (req, res) => {
  if (!openai) {
    return res.status(503).json({
      error: 'AI API key not configured. Set OPENAI_API_KEY or AI_GATEWAY_API_KEY.',
    });
  }
  const { messages, speech_context, scenario } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Body must include messages array.' });
  }
  const scenarioPrompt =
    scenario && SCENARIO_PROMPTS[scenario] ? SCENARIO_PROMPTS[scenario] : SCENARIO_PROMPTS.free_talk;
  try {
    const apiMessages = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${scenarioPrompt}` },
      ...messages,
    ];
    if (speech_context?.alternatives?.length) {
      apiMessages.push({
        role: 'system',
        content: `[Speech recognition note — do NOT change the user message text] Exact transcript shown to the child: "${speech_context.raw || ''}". Other microphone guesses: ${speech_context.alternatives.map((a) => `"${a}"`).join(', ')}. Use guesses only to interpret unclear audio; reply based on what they actually said.`,
      });
    }
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: apiMessages,
      max_tokens: 500,
      temperature: 0.7,
    });
    const content = completion.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { reply: content, scores: null, level: null };
    return res.json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'OpenAI request failed' });
  }
});

// 3D English Runner game API
app.use('/runner-api', createRunnerRouter(openai, AI_MODEL));

const runnerAppPath = path.join(distPath, 'runner-app');
if (existsSync(distPath)) {
  if (existsSync(runnerAppPath)) {
    app.use('/runner-app', express.static(runnerAppPath));
    app.get('/runner-app/*', (_req, res) => {
      res.sendFile(path.join(runnerAppPath, 'index.html'));
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
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // Fallback when runner-app bundle missing
  app.get('/runner-app/*', (_req, res) => {
    if (existsSync(path.join(runnerAppPath, 'index.html'))) {
      return res.sendFile(path.join(runnerAppPath, 'index.html'));
    }
    res.status(503).send('Runner game is not deployed yet. Please redeploy the application.');
  });
}

const PORT = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
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
      .then(() => console.log(`Registration email (SMTP) → ${REGISTER_TO_EMAIL}`))
      .catch((err) => console.error('SMTP verify failed:', err.message));
  } else if (RESEND_API_KEY) {
    console.log(`Registration email (Resend) → ${REGISTER_TO_EMAIL}`);
  } else {
    console.warn(
      'Registration email disabled: set RESEND_API_KEY or SMTP_USER + SMTP_PASS in .env'
    );
  }
});
