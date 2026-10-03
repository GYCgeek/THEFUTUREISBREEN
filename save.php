<?php
// save.php — Mission Control backend
// Upload this to your AwardSpace server alongside index.html

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$DATA_FILE = __DIR__ . '/mc_state.json';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Save state
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);

    if ($decoded === null) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
        exit;
    }

    $result = file_put_contents($DATA_FILE, json_encode($decoded));

    if ($result === false) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Could not write file']);
        exit;
    }

    echo json_encode(['ok' => true, 'saved' => date('c')]);

} elseif ($method === 'GET') {
    // Load state
    if (file_exists($DATA_FILE)) {
        $content = file_get_contents($DATA_FILE);
        echo $content;
    } else {
        echo json_encode(['tasks' => new stdClass(), 'notes' => new stdClass(), 'openDays' => new stdClass()]);
    }

} else {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
}
?>
