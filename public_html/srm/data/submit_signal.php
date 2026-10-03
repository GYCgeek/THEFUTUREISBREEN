<?php
// ════════════════════════════════════════════
// submit_signal.php — Community signal submission
// ════════════════════════════════════════════
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'POST only']));
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['title']) || empty($input['summary'])) {
    http_response_code(400);
    die(json_encode(['error' => 'Title and summary are required']));
}

// Rate limiting: max 5 submissions per IP per hour
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = __DIR__ . '/rate_limit_submits.json';
$rates = [];
if (file_exists($rateFile)) {
    $rates = json_decode(file_get_contents($rateFile), true) ?: [];
}
$cutoff = time() - 3600;
$rates = array_filter($rates, fn($ts) => $ts > $cutoff);
$ipCount = count(array_filter($rates, fn($v, $k) => str_starts_with($k, $ip . ':'), ARRAY_FILTER_USE_BOTH));
if ($ipCount >= 5) {
    http_response_code(429);
    die(json_encode(['error' => 'Too many submissions. Try again later.']));
}
$rates[$ip . ':' . time()] = time();
file_put_contents($rateFile, json_encode($rates));

// Sanitize
$signal = [
    'title'        => substr(trim($input['title']), 0, 500),
    'summary'      => substr(trim($input['summary']), 0, 2000),
    'source_url'   => substr(trim($input['source_url'] ?? ''), 0, 1000),
    'source_name'  => substr(trim($input['source_name'] ?? ''), 0, 200),
    'topic'        => substr(trim($input['topic'] ?? ''), 0, 200),
    'confidence'   => in_array($input['confidence'] ?? '', ['High','Medium','Low']) ? $input['confidence'] : 'Medium',
    'why_it_matters' => substr(trim($input['why_it_matters'] ?? ''), 0, 2000),
    'submitted_by' => substr(trim($input['submitted_by'] ?? ''), 0, 60),
    'submitted_at' => date('c'),
    'ip'           => $ip,
];

// Load pending queue
$pendingFile = __DIR__ . '/signals-pending.json';
$pending = ['pending' => []];
if (file_exists($pendingFile)) {
    $pending = json_decode(file_get_contents($pendingFile), true) ?: ['pending' => []];
}

// Add new signal
$pending['pending'][] = $signal;

// Save
$tmp = $pendingFile . '.tmp.' . uniqid();
file_put_contents($tmp, json_encode($pending, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
rename($tmp, $pendingFile);

echo json_encode([
    'status'  => 'ok',
    'message' => 'Signal submitted for review',
    'pending_count' => count($pending['pending']),
]);
