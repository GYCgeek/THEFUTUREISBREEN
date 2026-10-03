<?php
// ════════════════════════════════════════════
// sign_signal.php — Allows visitors to sign/endorse a signal
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
if (!$input || empty($input['signal_id']) || empty($input['name'])) {
    http_response_code(400);
    die(json_encode(['error' => 'Missing signal_id or name']));
}

$signalId = substr(preg_replace('/[^a-zA-Z0-9_\-]/', '', $input['signal_id']), 0, 200);
$name = substr(trim($input['name']), 0, 40);

if (empty($name)) {
    http_response_code(400);
    die(json_encode(['error' => 'Name is empty']));
}

// Rate limiting: max 20 signatures per IP per hour
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = __DIR__ . '/rate_limit_signs.json';
$rates = [];
if (file_exists($rateFile)) {
    $rates = json_decode(file_get_contents($rateFile), true) ?: [];
}
// Clean old entries
$cutoff = time() - 3600;
$rates = array_filter($rates, fn($ts) => $ts > $cutoff);
$ipCount = count(array_filter($rates, fn($v, $k) => str_starts_with($k, $ip . ':'), ARRAY_FILTER_USE_BOTH));
if ($ipCount >= 20) {
    http_response_code(429);
    die(json_encode(['error' => 'Rate limit exceeded. Try again later.']));
}
$rates[$ip . ':' . time() . ':' . mt_rand()] = time();
file_put_contents($rateFile, json_encode($rates));

// Load existing signatures
$sigFile = __DIR__ . '/signatures.json';
$signatures = [];
if (file_exists($sigFile)) {
    $signatures = json_decode(file_get_contents($sigFile), true) ?: [];
}

// Add signature (dedup by name per signal)
if (!isset($signatures[$signalId])) {
    $signatures[$signalId] = [];
}

if (!in_array($name, $signatures[$signalId])) {
    $signatures[$signalId][] = $name;

    // Cap at 100 signatures per signal
    if (count($signatures[$signalId]) > 100) {
        $signatures[$signalId] = array_slice($signatures[$signalId], -100);
    }
}

// Save
$tmp = $sigFile . '.tmp.' . uniqid();
file_put_contents($tmp, json_encode($signatures, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
rename($tmp, $sigFile);

echo json_encode([
    'status' => 'ok',
    'signal_id' => $signalId,
    'signatures' => $signatures[$signalId],
    'count' => count($signatures[$signalId]),
]);
