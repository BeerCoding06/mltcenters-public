#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(dirname(fileURLToPath(import.meta.url)), 'sync-brand-icons.py');
const faviconIco = join(root, 'public', 'favicon.ico');

function hasCommittedIcons() {
  return existsSync(faviconIco) && existsSync(join(root, 'public', 'icon-192.png'));
}

function pythonAvailable() {
  const r = spawnSync('python3', ['--version'], { stdio: 'ignore' });
  return r.status === 0;
}

if (!pythonAvailable()) {
  if (hasCommittedIcons()) {
    console.log('sync-brand-icons: python3 not found — using committed icons in public/');
    process.exit(0);
  }
  console.error('sync-brand-icons: python3 required to generate icons (pip install pillow)');
  process.exit(1);
}

const r = spawnSync('python3', [script], { stdio: 'inherit' });
if (r.status !== 0) {
  if (hasCommittedIcons()) {
    console.warn('sync-brand-icons: generation failed — using committed icons in public/');
    process.exit(0);
  }
  process.exit(r.status ?? 1);
}

process.exit(0);
