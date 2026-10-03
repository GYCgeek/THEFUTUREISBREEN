<?php
/**
 * GYC Foresight — Review API (PHP edition for Awardspace static hosting)
 *
 * Endpoints (all via review-api.php?action=<name>):
 *   GET  ?action=queue            — unreviewed signals (no auth)
 *   POST ?action=submit           — save a review to reviews-incoming.json
 *   GET  ?action=export&token=X   — export all pending reviews (token-protected)
 *   POST ?action=clear&token=X    — clear reviews-incoming.json after local pull
 *   GET  ?action=health           — health check / status
 *   POST ?action=apply            — not available on hosted site (503)
 *
 * Local cron workflow:
 *   1. Pull:  GET ?action=export&token=YOUR_TOKEN
 *   2. Merge: npm run intel:pull-reviews (or node research/scripts/pull-live-reviews.mjs)
 *   3. Build: npm run intel:build
 *   4. Clear: POST ?action=clear&token=YOUR_TOKEN  (optional)
 *
 * Configure REVIEW_EXPORT_TOKEN in review-api-config.php (see that file).
 */

// Load token config if present
$configFile = __DIR__ . '/review-api-config.php';
if (file_exists($configFile)) require_once $configFile;

// CORS — allow the intel pages on same host + localhost dev
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
// Prevent caching of queue and export responses
header('Cache-Control: no-store, no-cache, must-revalidate');

$action       = $_GET['action'] ?? '';
$dir          = __DIR__;
$reviewsFile  = $dir . '/reviews-incoming.json';
$signalsFile  = $dir . '/signals-v3.json';

// ---------------------------------------------------------------------------
// Helper: token-protected gate
// ---------------------------------------------------------------------------
function requireToken(): void {
    $defined   = defined('REVIEW_EXPORT_TOKEN') ? REVIEW_EXPORT_TOKEN : '';
    if ($defined === '' || $defined === 'change-me-to-a-secure-random-token') {
        http_response_code(403);
        echo json_encode([
            'error' => 'Export token not configured. Set REVIEW_EXPORT_TOKEN in review-api-config.php.',
        ]);
        exit;
    }
    $provided = $_GET['token'] ?? '';
    if (!hash_equals($defined, $provided)) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid token.']);
        exit;
    }
}

function requireReviewPassword(array $data): void {
    $defined = defined('REVIEW_SHARED_PASSWORD') ? trim((string) REVIEW_SHARED_PASSWORD) : '';
    if ($defined === '' || $defined === 'change-me-before-enabling-reviews') {
        http_response_code(503);
        echo json_encode([
            'error' => 'Review password not configured. Set REVIEW_SHARED_PASSWORD in review-api-config.php.',
        ]);
        exit;
    }
    $provided = (string)($data['review_password'] ?? $data['password'] ?? '');
    if ($provided === '' || !hash_equals($defined, $provided)) {
        http_response_code(401);
        echo json_encode(['error' => 'Shared review password is incorrect.']);
        exit;
    }
}

// ---------------------------------------------------------------------------
// Helper: load reviews-incoming.json
// ---------------------------------------------------------------------------
function loadReviews(string $file): array {
    if (!file_exists($file)) return [];
    $raw = file_get_contents($file);
    $arr = json_decode($raw, true);
    return is_array($arr) ? $arr : [];
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------
if ($action === 'health') {
    // Health check
    $reviews     = loadReviews($reviewsFile);
    $hasSignals  = file_exists($signalsFile);
    $signalCount = 0;
    if ($hasSignals) {
        $db          = json_decode(file_get_contents($signalsFile), true);
        $signalCount = count($db['signals'] ?? []);
    }
    echo json_encode([
        'ok'           => true,
        'mode'         => 'awardspace-php',
        'ts'           => gmdate('c'),
        'has_signals'  => $hasSignals,
        'signal_count' => $signalCount,
        'review_count' => count($reviews),
    ]);

} elseif ($action === 'queue') {
    // Serve unreviewed signals
    if (!file_exists($signalsFile)) {
        http_response_code(503);
        echo json_encode(['error' => 'signals-v3.json not found on server.', 'queue' => []]);
        exit;
    }
    $raw = file_get_contents($signalsFile);
    $db  = json_decode($raw, true);
    if (!$db || !isset($db['signals'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not parse signals-v3.json.', 'queue' => []]);
        exit;
    }
    // Build set of already-reviewed signal_ids from incoming file
    $reviews    = loadReviews($reviewsFile);
    $reviewedIds = array_flip(array_column($reviews, 'signal_id'));

    $queue = array_values(array_filter($db['signals'], function ($s) use ($reviewedIds) {
        $status = $s['scores']['review_status'] ?? '';
        if (in_array($status, ['checked', 'validated', 'archived'], true)) return false;
        if (isset($reviewedIds[$s['id']])) return false;
        return true;
    }));

    echo json_encode(['queue' => $queue]);

} elseif ($action === 'submit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Accept a review decision
    $body = file_get_contents('php://input');
    if (strlen($body) > 65536) {
        http_response_code(413);
        echo json_encode(['error' => 'Payload too large (max 64 KB).']);
        exit;
    }
    $data = json_decode($body, true);
    if (!$data || empty($data['signal_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'signal_id is required.']);
        exit;
    }
    requireReviewPassword($data);
    $reviewerName = trim((string)($data['reviewed_by'] ?? $data['reviewer'] ?? ''));
    if ($reviewerName === '') {
        http_response_code(400);
        echo json_encode(['error' => 'reviewer name is required.']);
        exit;
    }

    // Allowlist fields to avoid storing arbitrary user data
    $allowed = ['signal_id', 'reviewer', 'action', 'decision', 'score_overrides', 'note', 'reviewed_at'];
    $review  = array_intersect_key($data, array_flip($allowed));
    $review['signal_id']    = substr(preg_replace('/[^\w\-]/', '', (string)($review['signal_id'] ?? '')), 0, 120);
    $review['reviewer']     = substr(strip_tags($reviewerName), 0, 80);
    $review['note']         = substr(strip_tags((string)($review['note'] ?? '')), 0, 1000);
    $review['received_at']  = gmdate('c');
    $review['_source']      = 'awardspace-live';

    // File locking to handle concurrent writers
    $lockFile = $reviewsFile . '.lock';
    $fp = fopen($lockFile, 'c');
    if (!$fp || !flock($fp, LOCK_EX)) {
        http_response_code(503);
        echo json_encode(['error' => 'Could not acquire file lock.']);
        exit;
    }
    $existing = loadReviews($reviewsFile);
    // Remove prior decision for same signal_id+reviewer
    $existing = array_values(array_filter($existing, function ($r) use ($review) {
        return !(
            ($r['signal_id'] ?? '') === $review['signal_id'] &&
            ($r['reviewer']  ?? '') === $review['reviewer']
        );
    }));
    $existing[] = $review;
    file_put_contents($reviewsFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    flock($fp, LOCK_UN);
    fclose($fp);

    echo json_encode(['ok' => true, 'signal_id' => $review['signal_id'], 'total' => count($existing)]);

} elseif ($action === 'export') {
    // Token-protected export for local agent cron
    requireToken();
    $data = file_exists($reviewsFile) ? file_get_contents($reviewsFile) : '[]';
    echo $data;

} elseif ($action === 'clear' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Clear reviews after local pull (token-protected)
    requireToken();
    file_put_contents($reviewsFile, '[]');
    echo json_encode(['ok' => true, 'cleared_at' => gmdate('c')]);

} elseif ($action === 'apply') {
    // Rebuild not available on hosted site — return informative 503
    http_response_code(503);
    echo json_encode([
        'ok'    => false,
        'error' => 'Rebuild not available on hosted site.',
        'hint'  => 'Pull reviews locally: REVIEW_EXPORT_TOKEN=your-token node research/scripts/pull-live-reviews.mjs --clear — then run: npm run intel:build',
        'log'   => '',
    ]);

} else {
    http_response_code(400);
    echo json_encode([
        'error'   => 'Unknown or missing action.',
        'actions' => ['queue', 'submit', 'export', 'clear', 'health'],
    ]);
}
