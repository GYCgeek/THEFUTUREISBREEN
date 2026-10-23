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

// Review password comes from the Railway variable HS_ADMIN_PASS, never from code.
// If it is not set, every request is refused.
$adminPass = (string) getenv('HS_ADMIN_PASS');

$pass = (string) ($_SERVER['HTTP_X_ADMIN_PASS'] ?? '');
if ($adminPass === '' || !hash_equals($adminPass, $pass)) {
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
