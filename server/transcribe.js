/**
 * Speech-to-text via OpenAI-compatible Whisper (Groq / OpenAI).
 * Body: { audioBase64: string, mimeType?: string, language?: string }
 */
import { toFile } from 'openai';

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

    const { audioBase64, mimeType = 'audio/webm', language = 'en' } = req.body || {};
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    if (audioBase64.length > 10_000_000) {
      return res.status(413).json({ error: 'Audio too large' });
    }

    try {
      const buffer = Buffer.from(audioBase64, 'base64');
      if (buffer.length < 256) {
        return res.status(400).json({ error: 'Audio too short' });
      }

      const ext = mimeType.includes('mp4')
        ? 'mp4'
        : mimeType.includes('ogg')
          ? 'ogg'
          : mimeType.includes('wav')
            ? 'wav'
            : 'webm';

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

      const text = String(result?.text || '').replace(/\s+/g, ' ').trim();
      return res.json({ text, model: whisperModel });
    } catch (err) {
      console.error('[transcribe]', err);
      return res.status(500).json({
        error: err?.message || 'Transcription failed',
      });
    }
  };
}
