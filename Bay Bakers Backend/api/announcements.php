<?php

/**
 * Announcements API
 */

if (!isset($db)) {
    require_once __DIR__ . '/../config/database.php';
    $db = (new Database())->getConnection();
}

// Auto-create table
try {
    $db->exec("CREATE TABLE IF NOT EXISTS announcements (
        id INT PRIMARY KEY,
        message TEXT NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    
    // Seed initial announcement if empty
    $count = $db->query("SELECT COUNT(*) FROM announcements")->fetchColumn();
    if ($count == 0) {
        $db->exec("INSERT INTO announcements (id, message, is_active) VALUES (1, 'Welcome to Bay Bakers! Freshly baked goods delivered to your doorstep.', 1)");
    }
} catch (Exception $e) {}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $announcement = $db->query("SELECT * FROM announcements WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
        Response::success($announcement);
        break;

    case 'POST':
    case 'PUT':
        Auth::requireRole(['admin']);
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        $stmt = $db->prepare("UPDATE announcements SET message = ?, is_active = ? WHERE id = 1");
        $stmt->execute([
            $data['message'] ?? '',
            isset($data['is_active']) ? $data['is_active'] : 1
        ]);

        Response::success(null, 'Announcement updated successfully');
        break;

    default:
        Response::error('Method not allowed', 405);
}
