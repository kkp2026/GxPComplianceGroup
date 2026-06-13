<?php
require_once __DIR__ . '/config.php';
apply_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['ok' => false, 'error' => 'Method not allowed.'], 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];

// Honeypot check
if (!empty($input['website'])) {
    send_json(['ok' => true, 'custid' => '000000'], 201);
}

$fullName       = trim($input['fullName'] ?? '');
$email          = trim($input['email'] ?? '');
$contactNumber  = trim($input['contactNumber'] ?? '');
$organization   = trim($input['organization'] ?? '');
$areaOfInterest = trim($input['areaOfInterest'] ?? '');
$message        = trim($input['message'] ?? '');

$errors = [];
if ($fullName === '') $errors['fullName'] = 'Please enter your full name.';
if ($email === '') $errors['email'] = 'Please enter your email address.';
elseif (!preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email)) $errors['email'] = 'Please enter a valid email address.';
if ($contactNumber === '') $errors['phone'] = 'Please enter a contact number.';
elseif (!preg_match('/^\d{3}-\d{3}-\d{4}$/', $contactNumber)) $errors['phone'] = 'Please enter a valid contact number (xxx-xxx-xxxx).';
if ($organization === '') $errors['org'] = 'Please enter your organization.';
if ($areaOfInterest === '') $errors['topic'] = 'Please select an area of interest.';
if ($message === '') $errors['message'] = 'Please tell us how we can help.';

if (!empty($errors)) {
    send_json(['ok' => false, 'error' => 'Please correct the highlighted fields.', 'errors' => $errors], 400);
}

$conn = db_connect();

$stmt = $conn->prepare(
    'INSERT INTO inquiries (full_name, email, contact_number, organization, area_of_interest, message)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->bind_param('ssssss', $fullName, $email, $contactNumber, $organization, $areaOfInterest, $message);

if (!$stmt->execute()) {
    send_json(['ok' => false, 'error' => 'Server error. Please try again later.'], 500);
}

$custid = $stmt->insert_id;
$stmt->close();
$conn->close();

// Optional: send a notification email (configure mail() or SMTP as needed)
// mail('you@example.com', 'New Inquiry #' . $custid, $message);

send_json(['ok' => true, 'custid' => $custid], 201);
