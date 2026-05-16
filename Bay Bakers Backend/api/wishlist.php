<?php

/**
 * Wishlist API (Authenticated users)
 * GET    /wishlist         - Get user's wishlist
 * POST   /wishlist         - Add to wishlist
 * DELETE /wishlist/{id}    - Remove from wishlist (id = product_id)
 */

$authUser = Auth::require();

switch ($method) {
    case 'GET':
        $stmt = $db->prepare("
            SELECT w.id as wishlist_id, w.product_id, w.created_at,
                   p.name, p.price, p.image, p.stock, p.description,
                   c.name as category_name
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        ");
        $stmt->execute([$authUser['user_id']]);
        Response::success($stmt->fetchAll());
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['product_id'])) {
            Response::validationError('Product ID is required');
        }

        // Check if already in wishlist
        $stmt = $db->prepare("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$authUser['user_id'], $data['product_id']]);

        if ($stmt->fetch()) {
            // Toggle: remove if exists
            $stmt = $db->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?");
            $stmt->execute([$authUser['user_id'], $data['product_id']]);
            Response::success(null, 'Removed from wishlist');
        } else {
            $stmt = $db->prepare("INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)");
            $stmt->execute([$authUser['user_id'], $data['product_id']]);
            Response::created(null, 'Added to wishlist');
        }
        break;

    case 'DELETE':
        if (!$id) Response::validationError('Product ID is required');

        $stmt = $db->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$authUser['user_id'], $id]);

        Response::success(null, 'Removed from wishlist');
        break;

    default:
        Response::error('Method not allowed', 405);
}
