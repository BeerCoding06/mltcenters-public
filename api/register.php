<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require dirname(__DIR__) . '/mail/lib.php';

use PHPMailer\PHPMailer\Exception as MailException;

header('Access-Control-Allow-Origin: *');

$body = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON body']);
    exit;
}

$required = [
    'firstName',
    'lastName',
    'nickname',
    'company',
    'position',
    'educationLevel',
    'phone',
    'lineId',
    'email',
];

$missing = [];
foreach ($required as $field) {
    if (!isset($body[$field]) || trim((string) $body[$field]) === '') {
        $missing[] = $field;
    }
}

if ($missing) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fields: ' . implode(', ', $missing)]);
    exit;
}

$email = trim((string) $body['email']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address.']);
    exit;
}

$payload = [];
foreach ($required as $field) {
    $payload[$field] = trim((string) $body[$field]);
}

$mail = build_registration_email($payload);

try {
    send_registration_mail([
        'replyTo' => $email,
        'subject' => '[MLTCENTERS] Registration – ' . $payload['firstName'] . ' ' . $payload['lastName'],
        'text' => $mail['text'],
        'html' => $mail['html'],
    ]);
    echo json_encode(['ok' => true]);
} catch (MailException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'errorTh' => 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'errorTh' => 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    ]);
}
