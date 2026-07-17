<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\Exception as MailException;
use PHPMailer\PHPMailer\PHPMailer;

require __DIR__ . '/vendor/autoload.php';

/** @return array<string, string> */
function mail_load_env(string $rootDir): array
{
    $vars = [];
    foreach ([$rootDir . '/.env', $rootDir . '/server/.env'] as $path) {
        if (!is_readable($path)) {
            continue;
        }
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            continue;
        }
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            $pos = strpos($line, '=');
            if ($pos === false) {
                continue;
            }
            $key = trim(substr($line, 0, $pos));
            $value = trim(substr($line, $pos + 1));
            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }
            $vars[$key] = $value;
        }
    }
    return $vars;
}

function mail_env(string $key, ?string $default = null): ?string
{
    static $loaded = false;
    static $vars = [];

    if (!$loaded) {
        $root = dirname(__DIR__);
        $vars = mail_load_env($root);
        $loaded = true;
    }

    $fromEnv = getenv($key);
    if ($fromEnv !== false && $fromEnv !== '') {
        return $fromEnv;
    }

    return $vars[$key] ?? $default;
}

function mail_normalize_password(?string $pass): ?string
{
    if ($pass === null || $pass === '') {
        return null;
    }

    $pass = trim($pass);
    if (
        (str_starts_with($pass, '"') && str_ends_with($pass, '"')) ||
        (str_starts_with($pass, "'") && str_ends_with($pass, "'"))
    ) {
        $pass = substr($pass, 1, -1);
    }

    // Gmail App Passwords are often copied with spaces (abcd efgh ijkl mnop).
    return str_replace(' ', '', $pass);
}

function mail_assert_smtp_password(string $pass): void
{
    $lower = strtolower($pass);
    if (
        str_contains($lower, 'your-gmail') ||
        str_contains($lower, 'app-password')
    ) {
        throw new MailException(
            'MAIL_SMTP_PASS is not a valid Gmail App Password. Create one at Google Account → Security → App passwords.'
        );
    }

    if (strlen($pass) < 16) {
        throw new MailException(
            'MAIL_SMTP_PASS must be a 16-character Gmail App Password (not your normal Gmail login password).'
        );
    }
}

function mail_parse_recipients(?string $value): array
{
    $default = 'paradon.pokpingmaung@gmail.com,mltcenterth@gmail.com';
    $raw = $value ?: $default;
    $parts = preg_split('/[\s,;]+/', $raw, -1, PREG_SPLIT_NO_EMPTY);
    $emails = [];
    foreach ($parts as $part) {
        $email = trim($part);
        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $emails[] = $email;
        }
    }
    if ($emails === []) {
        return ['paradon.pokpingmaung@gmail.com', 'mltcenterth@gmail.com'];
    }
    return $emails;
}

/** @param array{replyTo?: string, subject: string, text: string, html: string} $data */
function send_registration_mail(array $data): void
{
    $smtpUser = trim((string) (mail_env('MAIL_SMTP_USER') ?? mail_env('SMTP_USER') ?? ''));
    $smtpPass = mail_normalize_password(mail_env('MAIL_SMTP_PASS') ?? mail_env('SMTP_PASS'));
    $recipients = mail_parse_recipients(mail_env('REGISTER_TO_EMAIL'));
    $fromEmail = mail_env('MAIL_SMTP_FROM', $smtpUser);
    $fromName = mail_env('MAIL_SMTP_FROM_NAME', 'MLTCENTERS Workshop');

    if ($smtpUser === '' || !$smtpPass) {
        throw new MailException('MAIL_SMTP_USER and MAIL_SMTP_PASS must be set in .env');
    }

    mail_assert_smtp_password($smtpPass);

    $mail = new PHPMailer(true);
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->isSMTP();
    $mail->Host = mail_env('MAIL_SMTP_HOST', 'smtp.gmail.com');
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = (int) (mail_env('MAIL_SMTP_PORT', '587'));

    $mail->setFrom((string) $fromEmail, $fromName);
    foreach ($recipients as $recipient) {
        $mail->addAddress($recipient);
    }

    if (!empty($data['replyTo'])) {
        $mail->addReplyTo((string) $data['replyTo']);
    }

    $mail->isHTML(true);
    $mail->Subject = (string) $data['subject'];
    $mail->Body = (string) $data['html'];
    $mail->AltBody = (string) $data['text'];

    try {
        $mail->send();
    } catch (MailException $e) {
        if (stripos($e->getMessage(), 'authenticate') !== false) {
            throw new MailException(
                'Gmail SMTP authentication failed. Use a 16-character App Password for '
                . $smtpUser
                . ' (Google Account → Security → 2-Step Verification → App passwords).'
            );
        }
        throw $e;
    }
}

/** @param array<string, mixed> $payload */
function build_registration_email(array $payload): array
{
    $labels = [
        'firstName' => 'First Name',
        'lastName' => 'Last Name',
        'nickname' => 'Nickname',
        'company' => 'Company',
        'position' => 'Position',
        'educationLevel' => 'Education Level',
        'phone' => 'Phone',
        'lineId' => 'Line ID',
        'email' => 'Email',
    ];

    $lines = [];
    $rows = '';
    foreach ($labels as $key => $label) {
        $value = htmlspecialchars((string) ($payload[$key] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $lines[] = $label . ': ' . ($payload[$key] ?? '');
        $rows .= '<tr><td style="font-weight:600;padding-right:12px;">' . $label . '</td><td>' . $value . '</td></tr>';
    }

    $submitted = gmdate('c');
    $text = "New MLTCENTERS Workshop Registration\n\n" . implode("\n", $lines) . "\n\nSubmitted at: {$submitted}";
    $html = '<h2>New MLTCENTERS Workshop Registration</h2>'
        . '<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">'
        . $rows
        . '</table>'
        . '<p style="color:#666;margin-top:16px;">Submitted at: ' . $submitted . '</p>';

    return ['text' => $text, 'html' => $html];
}
