/**
 * Pure-JS vocab store (no native modules).
 * Used when DATABASE_URL is not set — safe for Alpine / Dokploy builds.
 */
import fs from 'fs';
import path from 'path';

function emptyDb() {
  return {
    profiles: [],
    levels: [],
    words: [],
    sessions: [],
    quiz_results: [],
    word_stats: [],
    review_schedule: [],
    generated_sentences: [],
    seq: 1,
  };
}

export function createVocabFileStore(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  let data = emptyDb();
  if (fs.existsSync(filePath)) {
    try {
      data = { ...emptyDb(), ...JSON.parse(fs.readFileSync(filePath, 'utf8')) };
    } catch {
      data = emptyDb();
    }
  }

  let writeTimer = null;
  const persist = () => {
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data));
    fs.renameSync(tmp, filePath);
  };
  const schedulePersist = () => {
    if (writeTimer) return;
    writeTimer = setTimeout(() => {
      writeTimer = null;
      try {
        persist();
      } catch (err) {
        console.error('[vocab] file persist error:', err);
      }
    }, 250);
  };

  return {
    mode: 'file',
    path: filePath,
    /** @internal exposed for seed / Task 3 model */
    _data: data,
    getCollections() {
      return data;
    },
    countWordsByLevel(levelId) {
      return data.words.filter((w) => w.level_id === levelId).length;
    },
    upsertLevel(row) {
      const idx = data.levels.findIndex((r) => r.id === row.id || r.code === row.code);
      if (idx >= 0) {
        data.levels[idx] = { ...data.levels[idx], ...row };
      } else {
        data.levels.push({ ...row });
      }
      schedulePersist();
    },
    upsertWord(row) {
      const idx = data.words.findIndex((r) => r.id === row.id);
      if (idx >= 0) {
        data.words[idx] = { ...data.words[idx], ...row };
      } else {
        data.words.push({ ...row });
      }
      schedulePersist();
    },
    close() {
      if (writeTimer) {
        clearTimeout(writeTimer);
        writeTimer = null;
      }
      persist();
    },
  };
}
