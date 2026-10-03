<?php
// ════════════════════════════════════════════
// reject_signal.php — Admin rejects a pending signal
// ════════════════════════════════════════════
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Pass');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'POST only']));
}

// CHANGE THIS to your admin password (must match approve_signal.php)
define('ADMIN_PASS', 'foresight2026');

$pass = $_SERVER['HTTP_X_ADMIN_PASS'] ?? '';
if ($pass !== ADMIN_PASS) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

$input = json_decode(file_get_contents('php://input'), true);
$index = $input['index'] ?? -1;

$pendingFile = __DIR__ . '/signals-pending.json';
$pending = ['pending' => []];
if (file_exists($pendingFile)) {
    $pending = json_decode(file_get_contents($pendingFile), true) ?: ['pending' => []];
}

if (!isset($pending['pending'][$index])) {
    http_response_code(404);
    die(json_encode(['error' => 'Signal not found at index ' . $index]));
}

// Remove from pending
array_splice($pending['pending'], $index, 1);
file_put_contents($pendingFile, json_encode($pending, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    'status' => 'ok',
    'message' => 'Signal rejected',
    'remaining' => count($pending['pending']),
]);
