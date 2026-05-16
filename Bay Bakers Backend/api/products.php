<?php

/**
 * Products API
 * GET    /products         - List all products (with optional ?category=&search=)
 * GET    /products/{id}    - Get single product
 * POST   /products         - Create product (admin)
 * PUT    /products/{id}    - Update product (admin)
 * PATCH  /products/{id}/stock - Update stock only (admin/staff)
 * DELETE /products/{id}    - Delete product (admin)
 */

switch ($method) {
    // ── LIST / GET ONE ──
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("
                SELECT p.*, c.name as category_name 
                FROM products p 
                JOIN categories c ON p.category_id = c.id 
                WHERE p.id = ?
            ");
            $stmt->execute([$id]);
            $product = $stmt->fetch();

            if (!$product) {
                Response::notFound('Product not found');
            }
            Response::success($product);
        } else {
            $sql = "SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE 1=1";
            $params = [];

            if (!empty($_GET['category'])) {
                $sql .= " AND c.name = ?";
                $params[] = $_GET['category'];
            }
            if (!empty($_GET['search'])) {
                $sql .= " AND (p.name LIKE ? OR p.description LIKE ?)";
                $search = '%' . $_GET['search'] . '%';
                $params[] = $search;
                $params[] = $search;
            }
            if (isset($_GET['low_stock'])) {
                $sql .= " AND p.stock < 10";
            }

            $sql .= " ORDER BY p.created_at DESC";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $products = $stmt->fetchAll();

            Response::success($products);
        }
        break;

    // ── CREATE ──
    case 'POST':
        Auth::requireRole(['admin']);
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name']) || empty($data['category_id']) || !isset($data['price']) || !isset($data['stock'])) {
            Response::validationError('Name, category_id, price, and stock are required');
        }

        $stmt = $db->prepare("
            INSERT INTO products (name, category_id, price, image, description, stock, expiry_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['name'],
            $data['category_id'],
            $data['price'],
            $data['image'] ?? null,
            $data['description'] ?? null,
            $data['stock'],
            $data['expiry_date'] ?? null
        ]);

        $productId = $db->lastInsertId();
        $stmt = $db->prepare("SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?");
        $stmt->execute([$productId]);

        Response::created($stmt->fetch());
        break;

    // ── UPDATE ──
    case 'PUT':
        if (!$id) Response::validationError('Product ID is required');
        Auth::requireRole(['admin']);

        $data = json_decode(file_get_contents('php://input'), true);

        $stmt = $db->prepare("
            UPDATE products 
            SET name = COALESCE(?, name),
                category_id = COALESCE(?, category_id),
                price = COALESCE(?, price),
                image = COALESCE(?, image),
                description = COALESCE(?, description),
                stock = COALESCE(?, stock),
                expiry_date = COALESCE(?, expiry_date)
            WHERE id = ?
        ");
        $stmt->execute([
            $data['name'] ?? null,
            $data['category_id'] ?? null,
            $data['price'] ?? null,
            $data['image'] ?? null,
            $data['description'] ?? null,
            $data['stock'] ?? null,
            $data['expiry_date'] ?? null,
            $id
        ]);

        $stmt = $db->prepare("SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?");
        $stmt->execute([$id]);

        Response::success($stmt->fetch(), 'Product updated');
        break;

    // ── PATCH STOCK ──
    case 'PATCH':
        if (!$id) Response::validationError('Product ID is required');
        Auth::requireRole(['admin', 'staff']);

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['stock'])) {
            Response::validationError('Stock value is required');
        }

        $stmt = $db->prepare("UPDATE products SET stock = ? WHERE id = ?");
        $stmt->execute([max(0, (int)$data['stock']), $id]);

        Response::success(null, 'Stock updated');
        break;

    // ── DELETE ──
    case 'DELETE':
        if (!$id) Response::validationError('Product ID is required');
        Auth::requireRole(['admin']);

        $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            Response::notFound('Product not found');
        }

        Response::success(null, 'Product deleted');
        break;

    default:
        Response::error('Method not allowed', 405);
}
