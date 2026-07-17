// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  hashIp,
  parseUserAgent,
  resolveCountryCode,
  sanitizeMetadata,
  validateEventBatch,
} from './analytics-service.js';

import { getAdminCredentials } from './analytics-controller.js';

describe('admin login credentials', () => {
  it('defaults username to admin and accepts ADMIN_PASS or TOKEN', () => {
    const prevUser = process.env.ANALYTICS_ADMIN_USER;
    const prevPass = process.env.ANALYTICS_ADMIN_PASS;
    const prevToken = process.env.ANALYTICS_ADMIN_TOKEN;
    process.env.ANALYTICS_ADMIN_USER = 'boss';
    process.env.ANALYTICS_ADMIN_PASS = 'secret-pass';
    process.env.ANALYTICS_ADMIN_TOKEN = 'session-token';

    const creds = getAdminCredentials();
    expect(creds.username).toBe('boss');
    expect(creds.passwordCandidates).toContain('secret-pass');
    expect(creds.passwordCandidates).toContain('session-token');
    expect(creds.token).toBe('session-token');

    process.env.ANALYTICS_ADMIN_USER = prevUser;
    process.env.ANALYTICS_ADMIN_PASS = prevPass;
    process.env.ANALYTICS_ADMIN_TOKEN = prevToken;
  });
});

describe('analytics-service', () => {
  it('hashes IP without returning raw value', () => {
    const hashed = hashIp('1.2.3.4', 'salt');
    expect(hashed).not.toContain('1.2.3.4');
    expect(hashed).toHaveLength(64);
    expect(hashIp('1.2.3.4', 'salt')).toBe(hashed);
  });

  it('parses browser and device', () => {
    expect(parseUserAgent('Mozilla/5.0 (iPhone) Chrome/120.0').device_type).toBe('mobile');
    expect(parseUserAgent('Mozilla/5.0 Firefox/120.0').browser).toBe('Firefox');
  });

  it('resolves country from proxy headers', () => {
    expect(resolveCountryCode({ 'cf-ipcountry': 'th' })).toBe('TH');
    expect(resolveCountryCode({}, 'Asia/Bangkok')).toBe('TH');
    expect(resolveCountryCode({})).toBe('XX');
  });

  it('sanitizes metadata and blocks sensitive keys', () => {
    const clean = sanitizeMetadata({
      level: 'Beginner',
      email: 'a@b.com',
      score_avg: 80,
      nested: { a: 1 },
    });
    expect(clean).toEqual({ level: 'Beginner', score_avg: 80 });
  });

  it('validates event batches', () => {
    const bad = validateEventBatch({ events: [{ name: 'Bad Name', sessionId: 's', visitorId: 'v' }] });
    expect(bad.ok).toBe(false);

    const good = validateEventBatch({
      events: [
        {
          name: 'page_view',
          sessionId: 's1',
          visitorId: 'v1',
          ts: Date.now(),
          path: '/',
        },
      ],
    });
    expect(good.ok).toBe(true);
    expect(good.events).toHaveLength(1);
  });
});
