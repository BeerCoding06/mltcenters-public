#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const script = join(dirname(fileURLToPath(import.meta.url)), 'sync-brand-icons.py');
const r = spawnSync('python3', [script], { stdio: 'inherit' });
process.exit(r.status ?? 1);
