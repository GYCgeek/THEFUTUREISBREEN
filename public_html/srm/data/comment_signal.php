<?php
// ════════════════════════════════════════════
// comment_signal.php — Visitors post comments/suggestions on signals
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
if (!$input || empty($input['signal_id']) || empty($input['text'])) {
    http_response_code(400);
    die(json_encode(['error' => 'Missing signal_id or text']));
}

$signalId = substr(preg_replace('/[^a-zA-Z0-9_\-]/', '', $input['signal_id']), 0, 200);
$text = substr(trim($input['text']), 0, 500);
$author = substr(trim($input['author'] ?? 'Anonymous'), 0, 40);

if (empty($text)) {
    http_response_code(400);
    die(json_encode(['error' => 'Comment text is empty']));
}

// Rate limiting: max 15 comments per IP per hour
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = __DIR__ . '/rate_limit_comments.json';
$rates = [];
if (file_exists($rateFile)) {
    $rates = json_decode(file_get_contents($rateFile), true) ?: [];
}
$cutoff = time() - 3600;
$rates = array_filter($rates, fn($ts) => $ts > $cutoff);
$ipCount = count(array_filter($rates, fn($v, $k) => str_starts_with($k, $ip . ':'), ARRAY_FILTER_USE_BOTH));
if ($ipCount >= 15) {
    http_response_code(429);
    die(json_encode(['error' => 'Rate limit exceeded. Try again later.']));
}
$rates[$ip . ':' . time() . ':' . mt_rand()] = time();
file_put_contents($rateFile, json_encode($rates));

// Load existing comments
$cmtFile = __DIR__ . '/comments.json';
$comments = [];
if (file_exists($cmtFile)) {
    $comments = json_decode(file_get_contents($cmtFile), true) ?: [];
}

// Add comment
if (!isset($comments[$signalId])) {
    $comments[$signalId] = [];
}

$comment = [
    'author' => $author ?: 'Anonymous',
    'text' => $text,
    'time' => date('c'),
];

$comments[$signalId][] = $comment;

// Cap at 200 comments per signal
if (count($comments[$signalId]) > 200) {
    $comments[$signalId] = array_slice($comments[$signalId], -200);
}

// Save
$tmp = $cmtFile . '.tmp.' . uniqid();
file_put_contents($tmp, json_encode($comments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
rename($tmp, $cmtFile);

echo json_encode([
    'status' => 'ok',
    'signal_id' => $signalId,
    'comment' => $comment,
    'total' => count($comments[$signalId]),
]);
