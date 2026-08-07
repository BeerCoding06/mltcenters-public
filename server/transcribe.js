/**
 * Speech-to-text via OpenAI-compatible Whisper (Groq / OpenAI).
 * Accepts raw audio body (preferred) or JSON { audioBase64, mimeType, language }.
 */
import { toFile } from 'openai';

function extFromMime(mimeType = '') {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'webm';
}

async function transcribeBuffer(openai, buffer, mimeType, language, whisperModel) {
  if (!buffer || buffer.length < 256) {
    const err = new Error('Audio too short');
    err.status = 400;
    throw err;
  }
  if (buffer.length > 8_000_000) {
    const err = new Error('Audio too large');
    err.status = 413;
    throw err;
  }

  const ext = extFromMime(mimeType);
  const file = await toFile(buffer, `speech.${ext}`, {
    type: mimeType || `audio/${ext}`,
  });

  const result = await openai.audio.transcriptions.create({
    file,
    model: whisperModel,
    language: language === 'th' ? 'th' : 'en',
    response_format: 'json',
    temperature: 0,
  });

  return String(result?.text || '').replace(/\s+/g, ' ').trim();
}

export function createTranscribeHandler(openai, options = {}) {
  const whisperModel =
    options.whisperModel ||
    process.env.WHISPER_MODEL ||
    process.env.OPENAI_WHISPER_MODEL ||
    'whisper-large-v3';

  return async function transcribeHandler(req, res) {
    if (!openai) {
      return res.status(503).json({
        error: 'AI API key not configured. Set OPENAI_API_KEY or AI_GATEWAY_API_KEY.',
      });
    }

    try {
      let buffer;
      let mimeType = 'audio/webm';
      let language = 'en';

      if (Buffer.isBuffer(req.body)) {
        buffer = req.body;
        mimeType = String(req.headers['content-type'] || mimeType).split(';')[0].trim();
        language = String(req.headers['x-speech-language'] || language);
      } else if (req.body?.audioBase64) {
        // Legacy JSON fallback
        const { audioBase64, mimeType: mt, language: lang } = req.body;
        if (typeof audioBase64 !== 'string') {
          return res.status(400).json({ error: 'audioBase64 is required' });
        }
        if (audioBase64.length > 10_000_000) {
          return res.status(413).json({ error: 'Audio too large' });
        }
        buffer = Buffer.from(audioBase64, 'base64');
        mimeType = mt || mimeType;
        language = lang || language;
      } else {
        return res.status(400).json({
          error: 'Send raw audio body (audio/*) or JSON audioBase64',
        });
      }

      const text = await transcribeBuffer(openai, buffer, mimeType, language, whisperModel);
      return res.json({ text, model: whisperModel });
    } catch (err) {
      console.error('[transcribe]', err);
      const status = err?.status || 500;
      return res.status(status).json({
        error: err?.message || 'Transcription failed',
      });
    }
  };
}
