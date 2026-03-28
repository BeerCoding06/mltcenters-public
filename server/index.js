/**
 * Backend proxy for OpenAI – keeps API key server-side.
 * Run: npm install && OPENAI_API_KEY=sk-... npm start
 * Dev: listens on PORT (default 3000). With ../dist present, also serves the Vite SPA.
 */
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SYSTEM_PROMPT = `You are having a normal, friendly greeting conversation in English to understand the person's level. Act like someone saying hi and making small talk—not a test, just natural chat.
Rules:
- Talk like a normal greeting: "Hi! How are you?", "What's your name?", "What do you like to do?", "How was your day?" — one short message per turn, warm and natural.
- After they reply, respond with a single JSON object only, no other text:
{"reply": "Your natural reply (greeting, follow-up question, or friendly goodbye)", "scores": {"grammar": number 0-100, "vocabulary": number 0-100, "fluency": number 0-100, "coherence": number 0-100}, "level": "Beginner"|"Intermediate"|"Advanced"}
- From their message, estimate grammar, vocabulary, fluency, coherence (0-100). Level: Beginner 0-59, Intermediate 60-79, Advanced 80-100.
- Keep the chat to 5–8 exchanges. Start with a simple greeting, then small talk (name, day, hobbies, etc.), then say a nice goodbye in "reply".
- Always return only the JSON object as your entire message.`;

app.post('/api/assess', async (req, res) => {
  if (!openai) {
    return res.status(503).json({ error: 'OpenAI API key not configured. Set OPENAI_API_KEY.' });
  }
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Body must include messages array.' });
  }
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
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

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
app.listen(PORT, host, () => {
  console.log(`Server listening on http://${host}:${PORT}`);
});
