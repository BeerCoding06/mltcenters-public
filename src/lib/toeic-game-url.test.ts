import { describe, expect, it } from 'vitest';
import { resolveToeicGameUrl } from './toeic-game-url';

describe('resolveToeicGameUrl', () => {
  it('defaults to /millionaire', () => {
    expect(resolveToeicGameUrl(undefined)).toBe('/millionaire');
    expect(resolveToeicGameUrl('')).toBe('/millionaire');
  });

  it('keeps a valid same-origin path', () => {
    expect(resolveToeicGameUrl('/millionaire')).toBe('/millionaire');
    expect(resolveToeicGameUrl('/millionaire/play')).toBe('/millionaire/play');
  });

  it('rewrites the dead toeic subdomain', () => {
    expect(resolveToeicGameUrl('https://toeic.mltcenters.com')).toBe(
      '/millionaire',
    );
    expect(resolveToeicGameUrl('https://toeic.mltcenters.com/')).toBe(
      '/millionaire',
    );
  });

  it('rewrites localhost / loopback', () => {
    expect(resolveToeicGameUrl('http://localhost:3001')).toBe('/millionaire');
    expect(resolveToeicGameUrl('http://127.0.0.1:3002/millionaire')).toBe(
      '/millionaire',
    );
  });

  it('extracts path from a full www URL', () => {
    expect(
      resolveToeicGameUrl('https://www.mltcenters.com/millionaire'),
    ).toBe('/millionaire');
  });
});
