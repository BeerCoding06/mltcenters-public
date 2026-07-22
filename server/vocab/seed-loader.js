const REQUIRED = [
  'id', 'word', 'ipa', 'pos', 'meaning_th', 'difficulty',
  'frequency', 'category', 'example_en', 'example_th',
];

export function validateSeedWords(words) {
  if (!Array.isArray(words)) return { ok: false, count: 0, error: 'not array' };
  const seen = new Set();
  for (const w of words) {
    for (const k of REQUIRED) {
      if (w[k] === undefined || w[k] === null || w[k] === '') {
        return { ok: false, count: words.length, error: `missing ${k} on ${w.id || '?'}` };
      }
    }
    const key = String(w.word).toLowerCase();
    if (seen.has(key)) return { ok: false, count: words.length, error: `dup ${key}` };
    seen.add(key);
  }
  return { ok: words.length === 300, count: words.length, error: words.length === 300 ? null : 'count' };
}

export async function loadStarterSeed(model) {
  const { readFileSync } = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const words = JSON.parse(readFileSync(path.join(dir, 'seed/level1-starter.json'), 'utf8'));
  const v = validateSeedWords(words);
  if (!v.ok) throw new Error(`Invalid seed: ${v.error}`);
  await model.upsertLevel({
    id: 'starter',
    code: 'starter',
    name_th: 'Starter',
    name_en: 'Starter',
    target_word_count: 300,
    sort_order: 1,
  });
  for (const w of words) {
    await model.upsertWord({
      ...w,
      level_id: 'starter',
      status: 'active',
      tags_json: JSON.stringify(w.tags || []),
    });
  }
  return { count: words.length };
}
