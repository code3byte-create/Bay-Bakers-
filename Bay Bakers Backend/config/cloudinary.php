<?php

/**
 * Cloudinary Configuration
 * Reads credentials from environment variables, falls back to defaults below.
 * For production: set these via environment variables, do NOT commit secrets.
 */

$cloudName = getenv('CLOUDINARY_CLOUD_NAME');
$apiKey    = getenv('CLOUDINARY_API_KEY');
$apiSecret = getenv('CLOUDINARY_API_SECRET');

if (!$cloudName || !$apiKey || !$apiSecret) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Cloudinary credentials missing. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.'
    ]);
    exit;
}

return [
    'cloud_name' => $cloudName,
    'api_key'    => $apiKey,
    'api_secret' => $apiSecret,
    'folder'     => getenv('CLOUDINARY_FOLDER') ?: 'bay-bakers'
];
