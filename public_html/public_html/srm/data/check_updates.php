<?php
// ════════════════════════════════════════════
// check_updates.php — Live update polling endpoint
// ════════════════════════════════════════════
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache');

$dbFile = __DIR__ . '/signals-db.json';
$pendingFile = __DIR__ . '/signals-pending.json';

if (!file_exists($dbFile)) {
    http_response_code(404);
    die(json_encode(['error' => 'Database not found']));
}

$dbMtime = filemtime($dbFile);
$pendingMtime = file_exists($pendingFile) ? filemtime($pendingFile) : 0;

// Return last modified timestamps
echo json_encode([
    'signals_db_mtime' => $dbMtime,
    'pending_mtime' => $pendingMtime,
    'signals_db_date' => date('c', $dbMtime),
    'pending_date' => $pendingMtime ? date('c', $pendingMtime) : null,
]);
