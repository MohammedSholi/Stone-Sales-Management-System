<?php
/**
 * CORS and JSON Headers Middleware
 * Must be included BEFORE any output.
 */

// ── Always send JSON content-type ──
header('Content-Type: application/json; charset=UTF-8');

// ── CORS ──
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:8001',
    'http://127.0.0.1:8001',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://localhost:8080',
];

if (
    $origin &&
    (
        str_starts_with($origin, 'http://localhost') ||
        str_starts_with($origin, 'https://localhost') ||
        str_starts_with($origin, 'http://127.0.0.1') ||
        str_starts_with($origin, 'https://127.0.0.1')
    )
) {
    header('Access-Control-Allow-Origin: ' . $origin);
} elseif (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // For same-origin requests $origin is often empty – echo a safe localhost default
    header('Access-Control-Allow-Origin: http://localhost');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

// ── Handle preflight OPTIONS immediately ──
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
