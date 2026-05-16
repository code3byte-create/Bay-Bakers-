<?php

/**
 * Categories API
 * GET    /categories         - List all
 * GET    /categories/{id}    - Get one
 * POST   /categories         - Create (admin)
 * PUT    /categories/{id}    - Update (admin)
 * DELETE /categories/{id}    - Delete (admin)
 */

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            $cat = $stmt->fetch();
            if (!$cat) Response::notFound('Category not found');
            Response::success($cat);
        } else {
            $stmt = $db->query("
                SELECT c.*, COUNT(p.id) as product_count 
                FROM categories c 
                LEFT JOIN products p ON p.category_id = c.id 
                GROUP BY c.id 
                ORDER BY c.name
            ");
            Response::success($stmt->fetchAll());
        }
        break;

    case 'POST':
        Auth::requireRole(['admin']);
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name'])) {
            Response::validationError('Category name is required');
        }

        $stmt = $db->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
        $stmt->execute([$data['name'], $data['description'] ?? '']);

        $stmt = $db->prepare("SELECT * FROM categories WHERE id = ?");
        $stmt->execute([$db->lastInsertId()]);

        Response::created($stmt->fetch());
        break;

    case 'PUT':
        if (!$id) Response::validationError('Category ID is required');
        Auth::requireRole(['admin']);

        $data = json_decode(file_get_contents('php://input'), true);

        // Build dynamic update
        $fields = [];
        $params = [];

        if (isset($data['name'])) {
            $fields[] = "name = ?";
            $params[] = $data['name'];
        }
        if (isset($data['description'])) {
            $fields[] = "description = ?";
            $params[] = $data['description'];
        }

        if (empty($fields)) {
            Response::validationError('No fields to update');
        }

        $params[] = $id;
        $sql = "UPDATE categories SET " . implode(', ', $fields) . " WHERE id = ?";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $stmt = $db->prepare("SELECT * FROM categories WHERE id = ?");
        $stmt->execute([$id]);

        Response::success($stmt->fetch(), 'Category updated');
        break;

    case 'DELETE':
        if (!$id) Response::validationError('Category ID is required');
        Auth::requireRole(['admin']);

        // Check if category has products
        $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM products WHERE category_id = ?");
        $stmt->execute([$id]);
        $count = $stmt->fetch()['cnt'];

        if ($count > 0) {
            Response::error("Cannot delete category with $count products", 409);
        }

        $stmt = $db->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            Response::notFound('Category not found');
        }

        Response::success(null, 'Category deleted');
        break;

    default:
        Response::error('Method not allowed', 405);
}
