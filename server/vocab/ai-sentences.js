export function buildSentencesPrompt(knownWords) {
  const list = knownWords
    .slice(0, 40)
    .map((w) => `${w.word} (${w.meaning_th})`)
    .join(', ');
  return [
    {
      role: 'system',
      content:
        'You are an English tutor for Thai learners. Return ONLY JSON: {"sentences":[{"en":"...","th":"...","words":["word1"]}]} with exactly 5 items. Use ONLY the provided known words for English sentences. Keep sentences short (6-12 words).',
    },
    {
      role: 'user',
      content: `Known words: ${list}\nCreate 5 practice sentences.`,
    },
  ];
}

export function parseSentencesResponse(text) {
  const json = JSON.parse(text.replace(/^```json\n?|```$/g, '').trim());
  if (!Array.isArray(json.sentences) || json.sentences.length < 1) {
    throw new Error('bad sentences payload');
  }
  return json.sentences.slice(0, 5).map((s) => ({
    en: String(s.en || ''),
    th: String(s.th || ''),
    wordIds: [],
    words: Array.isArray(s.words) ? s.words.map(String) : [],
  }));
}

export function buildTemplateSentences(knownWords) {
  const pool = knownWords.slice(0, 20);
  if (pool.length === 0) return [];
  const sentences = [];
  for (let i = 0; i < 5; i++) {
    const w = pool[i % pool.length];
    sentences.push({
      en: `I can use the word ${w.word}.`,
      th: `ฉันสามารถใช้คำว่า ${w.meaning_th || w.word} ได้`,
      wordIds: [w.id],
    });
  }
  return sentences;
}
