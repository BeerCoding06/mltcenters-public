<?php

declare(strict_types=1);

require __DIR__ . '/lib.php';

use PHPMailer\PHPMailer\Exception as MailException;

$raw = stream_get_contents(STDIN);
$input = json_decode($raw ?: '', true);

if (!is_array($input)) {
    fwrite(STDERR, json_encode(['error' => 'Invalid JSON input']));
    exit(1);
}

try {
    send_registration_mail([
        'replyTo' => $input['replyTo'] ?? null,
        'subject' => (string) ($input['subject'] ?? ''),
        'text' => (string) ($input['text'] ?? ''),
        'html' => (string) ($input['html'] ?? ''),
    ]);
    fwrite(STDOUT, json_encode(['ok' => true]));
    exit(0);
} catch (MailException $e) {
    fwrite(STDERR, json_encode(['error' => $e->getMessage()]));
    exit(1);
} catch (Throwable $e) {
    fwrite(STDERR, json_encode(['error' => $e->getMessage()]));
    exit(1);
}
