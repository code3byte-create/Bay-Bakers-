<?php

/**
 * Feedback API
 * GET   /feedback            - List all (admin)
 * POST  /feedback            - Submit feedback (anyone)
 * PATCH /feedback/{id}       - Update status (admin)
 */

switch ($method) {
    case 'GET':
        Auth::requireRole(['admin']);

        $sql = "SELECT * FROM feedback WHERE 1=1";
        $params = [];

        if (!empty($_GET['search'])) {
            $sql .= " AND (customer_name LIKE ? OR email LIKE ?)";
            $search = '%' . $_GET['search'] . '%';
            $params[] = $search;
            $params[] = $search;
        }
        if (!empty($_GET['status'])) {
            $sql .= " AND status = ?";
            $params[] = $_GET['status'];
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $feedbacks = $stmt->fetchAll();

        // Also return stats
        $stmt = $db->query("SELECT COUNT(*) as total, 
            SUM(CASE WHEN status = 'New' THEN 1 ELSE 0 END) as new_count,
            AVG(rating) as avg_rating 
            FROM feedback");
        $stats = $stmt->fetch();

        Response::success([
            'feedback' => $feedbacks,
            'stats'    => $stats
        ]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['customer_name']) || empty($data['email']) || empty($data['rating']) || empty($data['message'])) {
            Response::validationError('Name, email, rating, and message are required');
        }

        if ($data['rating'] < 1 || $data['rating'] > 5) {
            Response::validationError('Rating must be between 1 and 5');
        }

        $stmt = $db->prepare("INSERT INTO feedback (customer_name, email, rating, message) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['customer_name'], $data['email'], $data['rating'], $data['message']]);

        $stmt = $db->prepare("SELECT * FROM feedback WHERE id = ?");
        $stmt->execute([$db->lastInsertId()]);

        Response::created($stmt->fetch(), 'Feedback submitted');
        break;

    case 'PATCH':
        if (!$id) Response::validationError('Feedback ID is required');
        Auth::requireRole(['admin']);

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['status'])) {
            Response::validationError('Status is required');
        }

        $stmt = $db->prepare("UPDATE feedback SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $id]);

        if ($stmt->rowCount() === 0) {
            Response::notFound('Feedback not found');
        }

        Response::success(null, 'Feedback status updated');
        break;

    default:
        Response::error('Method not allowed', 405);
}
