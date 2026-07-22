import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateSeedWords } from './seed-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('level1 seed', () => {
  it('has exactly 300 valid words', () => {
    const raw = JSON.parse(
      readFileSync(path.join(__dirname, 'seed/level1-starter.json'), 'utf8')
    );
    const result = validateSeedWords(raw);
    expect(result.ok).toBe(true);
    expect(result.count).toBe(300);
  });
});
