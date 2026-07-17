import { spawn } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAIL_DIR = path.join(__dirname, '../mail');
const PHP_SCRIPT = path.join(MAIL_DIR, 'register-cli.php');
const PHP_VENDOR = path.join(MAIL_DIR, 'vendor/autoload.php');

const MAMP_PHP_CANDIDATES = [
  '/Applications/MAMP/bin/php/php8.2.0/bin/php',
  '/Applications/MAMP/bin/php/php8.1.13/bin/php',
  '/Applications/MAMP/bin/php/php8.3.14/bin/php',
  '/usr/bin/php83',
  '/usr/bin/php',
];

function resolvePhpBin() {
  if (process.env.PHP_BIN) {
    return process.env.PHP_BIN;
  }
  for (const candidate of MAMP_PHP_CANDIDATES) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return 'php';
}

export function isPhpMailerReady() {
  return existsSync(PHP_SCRIPT) && existsSync(PHP_VENDOR);
}

function mailChildEnv() {
  const keys = [
    'MAIL_SMTP_USER',
    'MAIL_SMTP_PASS',
    'MAIL_SMTP_FROM',
    'MAIL_SMTP_FROM_NAME',
    'MAIL_SMTP_HOST',
    'MAIL_SMTP_PORT',
    'REGISTER_TO_EMAIL',
    'SMTP_USER',
    'SMTP_PASS',
  ];
  const env = { ...process.env };
  for (const key of keys) {
    if (process.env[key] !== undefined) {
      env[key] = process.env[key];
    }
  }
  return env;
}

/**
 * @param {{ replyTo: string, subject: string, text: string, html: string }} payload
 */
export function sendViaPhpMailer(payload) {
  const phpBin = resolvePhpBin();

  return new Promise((resolve, reject) => {
    const proc = spawn(phpBin, [PHP_SCRIPT], {
      env: mailChildEnv(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      reject(new Error(`Cannot run PHP (${phpBin}): ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(JSON.parse(stdout || '{}'));
        return;
      }

      try {
        const parsed = JSON.parse(stderr || '{}');
        reject(new Error(parsed.error || stderr || 'PHPMailer failed'));
      } catch {
        reject(new Error(stderr || stdout || `PHPMailer exited with code ${code}`));
      }
    });

    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });
}
