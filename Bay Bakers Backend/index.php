<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

/**
 * Bay Bakers API - Main Entry Point
 * 
 * URL Pattern: /backend/index.php/{resource}/{id?}
 * Or with .htaccess: /api/{resource}/{id?}
 */

require_once __DIR__ . '/helpers/Env.php';
Env::load(__DIR__ . '/.env');

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/Response.php';
require_once __DIR__ . '/helpers/Auth.php';

// Parse the request
$requestUri = $_SERVER['REQUEST_URI'];
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));

// Remove base path and query string
$path = parse_url($requestUri, PHP_URL_PATH);
$path = urldecode($path);
if ($scriptDir !== '/' && str_starts_with($path, $scriptDir)) {
    $path = substr($path, strlen($scriptDir));
}
$path = trim($path, '/');
$segments = $path ? explode('/', $path) : [];

$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;
$action = $segments[2] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

// Get DB connection
$db = (new Database())->getConnection();

// Route to the correct API file
switch ($resource) {
    case 'auth':
        require_once __DIR__ . '/api/auth.php';
        break;

    case 'products':
        require_once __DIR__ . '/api/products.php';
        break;

    case 'categories':
        require_once __DIR__ . '/api/categories.php';
        break;

    case 'upload':
        require_once __DIR__ . '/api/upload.php';
        break;

    case 'slides':
        require_once __DIR__ . '/api/slides.php';
        break;

    case 'announcements':
        require_once __DIR__ . '/api/announcements.php';
        break;

    case 'orders':
        require_once __DIR__ . '/api/orders.php';
        break;

    case 'users':
        require_once __DIR__ . '/api/users.php';
        break;

    case 'feedback':
        require_once __DIR__ . '/api/feedback.php';
        break;

    case 'delivery-staff':
        require_once __DIR__ . '/api/delivery_staff.php';
        break;

    case 'staff':
        require_once __DIR__ . '/api/staff.php';
        break;

    case 'wishlist':
        require_once __DIR__ . '/api/wishlist.php';
        break;

    case 'dashboard':
        require_once __DIR__ . '/api/dashboard.php';
        break;

    case '':
        Response::success([
            'name'    => 'Bay Bakers API',
            'version' => '1.0.0',
            'status'  => 'running'
        ]);
        break;

    default:
        Response::notFound("Endpoint '/$resource' not found");
}
