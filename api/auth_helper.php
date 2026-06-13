<?php
/**
 * Minimal token helper (HMAC-signed, JSON payload, base64url encoded)
 * Replaces jsonwebtoken from the Node version. No external libraries needed.
 */

require_once __DIR__ . '/config.php';

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function create_token($payload, $expiresInSeconds = 28800) { // 8 hours
    $payload['exp'] = time() + $expiresInSeconds;
    $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $body = base64url_encode(json_encode($payload));
    $signature = base64url_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    return "$header.$body.$signature";
}

function verify_token($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    list($header, $body, $signature) = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    if (!hash_equals($expected, $signature)) return null;
    $payload = json_decode(base64url_decode($body), true);
    if (!$payload || (isset($payload['exp']) && $payload['exp'] < time())) return null;
    return $payload;
}

function get_bearer_token() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.*)$/i', $auth, $m)) return $m[1];
    return null;
}

function require_auth() {
    $token = get_bearer_token();
    if (!$token) send_json(['ok' => false, 'error' => 'Access denied. No token provided.'], 401);
    $payload = verify_token($token);
    if (!$payload) send_json(['ok' => false, 'error' => 'Invalid or expired token.'], 403);
    return $payload;
}

function require_admin($user) {
    if (($user['role'] ?? '') !== 'admin') {
        send_json(['ok' => false, 'error' => 'Admin access required.'], 403);
    }
}
