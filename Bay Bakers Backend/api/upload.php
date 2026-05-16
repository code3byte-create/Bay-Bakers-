<?php

/**
 * Image Upload API
 * POST /upload - Upload an image to Cloudinary (with auto-compression)
 */

Auth::requireRole(['admin', 'staff']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

if (!isset($_FILES['image'])) {
    Response::validationError('No image file provided');
}

$file = $_FILES['image'];

// Basic validation
$check = getimagesize($file['tmp_name']);
if ($check === false) {
    Response::error('File is not an image');
}

// Max 10 MB at upload-endpoint (Cloudinary free tier accepts up to 10MB)
if ($file['size'] > 10 * 1024 * 1024) {
    Response::error('File is too large (max 10MB)');
}

$imageFileType = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
if (!in_array($imageFileType, $allowed, true)) {
    Response::error('Only JPG, JPEG, PNG, GIF & WEBP files are allowed');
}

// ── Cloudinary signed upload ───────────────────────────────────────────────
$cfg = require __DIR__ . '/../config/cloudinary.php';

$timestamp = time();
$folder    = $cfg['folder'];

// Server-side transformations (compression + smart crop ready URLs)
// Cloudinary will store one master; deliveries use f_auto,q_auto for further optimization.
$paramsToSign = [
    'folder'    => $folder,
    'timestamp' => $timestamp,
    // Apply incoming transformation: limit width to 1600px, auto quality
    'eager'     => 'w_1600,c_limit,q_auto,f_auto',
];

// Build signature string: alphabetical key=value pairs joined by &, then append api_secret
ksort($paramsToSign);
$toSign = '';
foreach ($paramsToSign as $k => $v) {
    $toSign .= ($toSign === '' ? '' : '&') . $k . '=' . $v;
}
$signature = sha1($toSign . $cfg['api_secret']);

$postFields = $paramsToSign + [
    'api_key'   => $cfg['api_key'],
    'signature' => $signature,
    'file'      => new CURLFile($file['tmp_name'], $file['type'] ?? 'application/octet-stream', $file['name']),
];

$endpoint = "https://api.cloudinary.com/v1_1/{$cfg['cloud_name']}/image/upload";

if (!function_exists('curl_init')) {
    Response::error('Server is missing cURL extension required for Cloudinary uploads', 500);
}

$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // XAMPP local dev
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false) {
    Response::error('Cloudinary upload failed: ' . $curlErr, 500);
}

$json = json_decode($response, true);

if ($httpCode !== 200 || empty($json['secure_url'])) {
    $msg = $json['error']['message'] ?? 'Unknown Cloudinary error';
    Response::error('Cloudinary upload failed: ' . $msg, 500);
}

// Build a delivery URL with auto-format & auto-quality so images are compressed on every fetch
$secureUrl = $json['secure_url'];
$deliveryUrl = preg_replace(
    '#/upload/#',
    '/upload/f_auto,q_auto/',
    $secureUrl,
    1
);

Response::success([
    'url'        => $deliveryUrl,
    'public_id'  => $json['public_id'] ?? null,
    'bytes'      => $json['bytes']     ?? null,
    'format'     => $json['format']    ?? null,
], 'Image uploaded successfully');
