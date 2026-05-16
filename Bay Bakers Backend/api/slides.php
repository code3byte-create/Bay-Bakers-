<?php

/**
 * Hero Slides API
 */

// Get DB connection (if not already defined)
if (!isset($db)) {
    require_once __DIR__ . '/../config/database.php';
    $db = (new Database())->getConnection();
}

// Auto-create table if not exists
try {
    $db->exec("CREATE TABLE IF NOT EXISTS hero_slides (
        id INT AUTO_INCREMENT PRIMARY KEY, 
        image_url TEXT NOT NULL, 
        title VARCHAR(255), 
        subtitle TEXT, 
        priority INT DEFAULT 0, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
} catch (Exception $e) {
    // Table already exists or creation failed
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $db->query("SELECT * FROM hero_slides ORDER BY priority DESC, created_at DESC");
        $slides = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($slides);
        break;

    case 'POST':
        Auth::requireRole(['admin']);
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (empty($data['image_url'])) {
            Response::validationError('Image URL is required');
        }

        $stmt = $db->prepare("INSERT INTO hero_slides (image_url, title, subtitle, priority) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['image_url'],
            $data['title'] ?? '',
            $data['subtitle'] ?? '',
            $data['priority'] ?? 0
        ]);

        Response::success(['id' => $db->lastInsertId()], 'Slide added successfully', 201);
        break;

    case 'DELETE':
        Auth::requireRole(['admin']);
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Response::validationError('Slide ID is required');
        }

        $stmt = $db->prepare("DELETE FROM hero_slides WHERE id = ?");
        $stmt->execute([$id]);
        Response::success(null, 'Slide deleted successfully');
        break;

    default:
        Response::error('Method not allowed', 405);
}
