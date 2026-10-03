<?php
/**
 * GYC Foresight — Donor Portal API (PHP edition for Awardspace static hosting)
 *
 * Endpoints (all via donor-portal.php?action=<name>):
 *   POST ?action=submit           — store a donor's preferences/consent
 *   GET  ?action=export&token=X   — export all submissions (token-protected)
 *   POST ?action=clear&token=X    — clear submissions after a local pull
 *   GET  ?action=health           — health check / count
 *
 * Data lands in donor-submissions.json (JSON array). Consent is captured
 * granularly with a server timestamp; the client IP is stored only as a salted
 * hash for abuse control, never in the clear. Configure DONOR_EXPORT_TOKEN in
 * donor-portal-config.php.
 */

$configFile = __DIR__ . '/donor-portal-config.php';
if (file_exists($configFile)) require_once $configFile;

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$action = $_GET['action'] ?? '';
$dir    = __DIR__;
$file   = $dir . '/donor-submissions.json';

// Allowlisted option ids — anything else is dropped, so we never store junk.
$ALLOWED_COLLAB  = ['sponsor-milestone', 'partnership', 'volunteer', 'technical', 'funder-intro', 'advisory', 'just-giving'];
$ALLOWED_CONSENT = ['updates', 'newsletter', 'public-ack', 'contact-collab'];
$ALLOWED_TIER    = ['milestone', 'co-sponsor', 'strategic', 'unsure'];

function requireToken(): void {
    $defined = defined('DONOR_EXPORT_TOKEN') ? DONOR_EXPORT_TOKEN : '';
    if ($defined === '' || $defined === 'change-me') {
        http_response_code(403);
        echo json_encode(['error' => 'Export token not configured.']);
        exit;
    }
    $provided = $_GET['token'] ?? '';
    if (!hash_equals($defined, $provided)) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid token.']);
        exit;
    }
}

function loadAll(string $file): array {
    if (!file_exists($file)) return [];
    $arr = json_decode(file_get_contents($file), true);
    return is_array($arr) ? $arr : [];
}

if ($action === 'health') {
    echo json_encode([
        'ok'    => true,
        'mode'  => 'awardspace-php',
        'ts'    => gmdate('c'),
        'count' => count(loadAll($file)),
    ]);
    exit;
}

if ($action === 'submit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = file_get_contents('php://input');
    if (strlen($body) > 16384) {
        http_response_code(413);
        echo json_encode(['error' => 'Payload too large.']);
        exit;
    }
    $data = json_decode($body, true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON.']);
        exit;
    }

    // Honeypot: bots fill hidden "website". Pretend success, store nothing.
    if (!empty($data['website'])) {
        echo json_encode(['ok' => true]);
        exit;
    }

    $name    = trim(substr(strip_tags((string)($data['name'] ?? '')), 0, 120));
    $org     = trim(substr(strip_tags((string)($data['organization'] ?? '')), 0, 140));
    $email   = trim(substr((string)($data['email'] ?? ''), 0, 160));
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email.']);
        exit;
    }
    $message = trim(substr(strip_tags((string)($data['message'] ?? '')), 0, 1500));

    $collaborate = array_values(array_intersect(
        is_array($data['collaborate'] ?? null) ? $data['collaborate'] : [],
        $ALLOWED_COLLAB
    ));
    $consent = array_values(array_intersect(
        is_array($data['consent'] ?? null) ? $data['consent'] : [],
        $ALLOWED_CONSENT
    ));
    $tierIn      = (string)($data['sponsor_tier'] ?? '');
    $sponsorTier = in_array($tierIn, $ALLOWED_TIER, true) ? $tierIn : '';

    // Reject fully empty submissions (nothing meaningful to store).
    if ($name === '' && $org === '' && $email === '' && $message === '' && !$collaborate && !$consent) {
        http_response_code(400);
        echo json_encode(['error' => 'Empty submission.']);
        exit;
    }

    $ipHash = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|gyc-donor-salt'), 0, 16);

    $record = [
        'name'         => $name,
        'organization' => $org,
        'email'        => $email,
        'collaborate'  => $collaborate,
        'sponsor_tier' => $sponsorTier,
        'consent'      => $consent,
        'message'      => $message,
        'submitted_at' => (string)($data['submitted_at'] ?? ''),
        'received_at'  => gmdate('c'),
        'ip_hash'      => $ipHash,
    ];

    $lockFile = $file . '.lock';
    $fp = fopen($lockFile, 'c');
    if (!$fp || !flock($fp, LOCK_EX)) {
        http_response_code(503);
        echo json_encode(['error' => 'Could not acquire lock.']);
        exit;
    }
    $all = loadAll($file);

    // Light rate-limit: cap total, and dedupe identical rapid re-submits.
    if (count($all) >= 5000) { array_shift($all); }
    $last = end($all);
    if ($last && ($last['ip_hash'] ?? '') === $ipHash && ($last['message'] ?? '') === $message
        && ($last['email'] ?? '') === $email && (time() - strtotime($last['received_at'] ?? '0')) < 5) {
        flock($fp, LOCK_UN); fclose($fp);
        echo json_encode(['ok' => true, 'total' => count($all), 'deduped' => true]);
        exit;
    }

    $all[] = $record;
    file_put_contents($file, json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    flock($fp, LOCK_UN);
    fclose($fp);

    echo json_encode(['ok' => true, 'total' => count($all)]);
    exit;
}

if ($action === 'export') {
    requireToken();
    echo file_exists($file) ? file_get_contents($file) : '[]';
    exit;
}

if ($action === 'clear' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireToken();
    file_put_contents($file, '[]');
    echo json_encode(['ok' => true, 'cleared_at' => gmdate('c')]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown or missing action.', 'actions' => ['submit', 'export', 'clear', 'health']]);
