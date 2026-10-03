<?php
// ════════════════════════════════════════════
// approve_signal.php — Admin approves a pending signal
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

// CHANGE THIS to your admin password
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

// Extract the approved signal
$approved = $pending['pending'][$index];
unset($approved['ip']); // remove IP before making public

// Remove from pending
array_splice($pending['pending'], $index, 1);
file_put_contents($pendingFile, json_encode($pending, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Add to main signals-db.json
$dbFile = __DIR__ . '/signals-db.json';
$db = ['version' => 1, 'updated_at' => date('Y-m-d'), 'signals' => []];
if (file_exists($dbFile)) {
    $db = json_decode(file_get_contents($dbFile), true) ?: $db;
}

// Convert to signals-db format
$newSignal = [
    'id'              => 'community-' . date('Y-m-d') . '-' . count($db['signals']),
    'topic'           => $approved['topic'] ?? '',
    'title'           => $approved['title'],
    'source_url'      => $approved['source_url'] ?? '',
    'source_name'     => $approved['source_name'] ?? '',
    'first_seen_date' => date('Y-m-d'),
    'last_seen_date'  => date('Y-m-d'),
    'last_posted_date'=> date('Y-m-d'),
    'status'          => 'active',
    'summary'         => $approved['summary'] ?? '',
    'why_it_matters'  => $approved['why_it_matters'] ?? '',
    'confidence'      => $approved['confidence'] ?? 'Medium',
    'update_note'     => 'Community submission by ' . ($approved['submitted_by'] ?: 'anonymous'),
];

$db['signals'][] = $newSignal;
$db['updated_at'] = date('Y-m-d');

$tmp = $dbFile . '.tmp.' . uniqid();
file_put_contents($tmp, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
rename($tmp, $dbFile);

echo json_encode([
    'status' => 'ok',
    'message' => 'Signal approved and published',
    'signal_id' => $newSignal['id'],
]);
