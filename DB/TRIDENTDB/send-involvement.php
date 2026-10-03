<?php
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Get POST data
$postData = json_decode(file_get_contents('php://input'), true);

if (!$postData) {
    echo json_encode(['success' => false, 'message' => 'No data received']);
    exit;
}

// Email configuration
$to = 'theglobalyouthcoalition@gmail.com';
$subject = $postData['subject'] ?? 'New Involvement Form Submission';
$type = $postData['type'] ?? 'Unknown';

// Build email body
$body = "New {$type} submission:\n\n";
foreach ($postData as $key => $value) {
    if ($key !== 'subject' && $key !== 'type') {
        $fieldName = ucwords(str_replace('_', ' ', $key));
        $body .= "{$fieldName}: {$value}\n";
    }
}

// Headers
$headers = [
    'From: noreply@theglobalyouth.co',
    'Reply-To: ' . ($postData['email'] ?? 'noreply@theglobalyouth.co'),
    'X-Mailer: PHP/' . phpversion(),
    'Content-Type: text/plain; charset=UTF-8'
];

// Send email
$mailSent = mail($to, $subject, $body, implode("\r\n", $headers));

// Return response
echo json_encode([
    'success' => $mailSent,
    'message' => $mailSent ? 'Form submitted successfully' : 'Error sending email'
]);