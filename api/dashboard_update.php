<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_helper.php';
apply_cors();

require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    send_json(['ok' => false, 'error' => 'Method not allowed.'], 405);
}

$custid = isset($_GET['custid']) ? intval($_GET['custid']) : 0;
if (!$custid) send_json(['ok' => false, 'error' => 'custid is required.'], 400);

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$status = $input['status'] ?? null;
$notes  = $input['internal_notes'] ?? null;

$validStatuses = ['new', 'in process/talks', 'contacted', 'on hold', 'Closed'];

$fields = [];
$types = '';
$values = [];

if ($status !== null) {
    if (!in_array($status, $validStatuses, true)) {
        send_json(['ok' => false, 'error' => 'Invalid status.'], 400);
    }
    $fields[] = 'status = ?';
    $types .= 's';
    $values[] = $status;
}

if ($notes !== null) {
    $fields[] = 'internal_notes = ?';
    $types .= 's';
    $values[] = $notes;
}

if (empty($fields)) {
    send_json(['ok' => false, 'error' => 'Nothing to update.'], 400);
}

$conn = db_connect();
$sql = 'UPDATE inquiries SET ' . implode(', ', $fields) . ' WHERE custid = ?';
$types .= 'i';
$values[] = $custid;

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$values);
$stmt->execute();

if ($stmt->affected_rows === 0) {
    // Could be "no row found" OR "values unchanged" — check existence
    $check = $conn->prepare('SELECT custid FROM inquiries WHERE custid = ?');
    $check->bind_param('i', $custid);
    $check->execute();
    if ($check->get_result()->num_rows === 0) {
        send_json(['ok' => false, 'error' => 'Inquiry not found.'], 404);
    }
}
$stmt->close();

$result = $conn->prepare('SELECT * FROM inquiries WHERE custid = ?');
$result->bind_param('i', $custid);
$result->execute();
$inquiry = $result->get_result()->fetch_assoc();
$conn->close();

send_json(['ok' => true, 'inquiry' => $inquiry]);
