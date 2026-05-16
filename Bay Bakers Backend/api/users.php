<?php

/**
 * Users API (Admin only)
 * GET    /users         - List all users
 * POST   /users         - Add user
 * DELETE /users/{id}    - Delete user
 */

Auth::requireRole(['admin']);

switch ($method) {
    case 'GET':
        $sql = "SELECT id, name, email, phone, role, created_at FROM users WHERE 1=1";
        $params = [];

        if (!empty($_GET['search'])) {
            $sql .= " AND (name LIKE ? OR email LIKE ?)";
            $search = '%' . $_GET['search'] . '%';
            $params[] = $search;
            $params[] = $search;
        }
        if (!empty($_GET['role'])) {
            $sql .= " AND role = ?";
            $params[] = $_GET['role'];
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::success($stmt->fetchAll());
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name']) || empty($data['email']) || empty($data['phone']) || empty($data['password'])) {
            Response::validationError('Name, email, phone, and password are required');
        }

        // Check duplicate email
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            Response::error('Email already exists', 409);
        }

        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $role = $data['role'] ?? 'customer';

        $stmt = $db->prepare("INSERT INTO users (name, email, phone, role, password) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['email'], $data['phone'], $role, $hashedPassword]);

        $stmt = $db->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$db->lastInsertId()]);

        Response::created($stmt->fetch());
        break;

    case 'DELETE':
        if (!$id) Response::validationError('User ID is required');

        // Prevent deleting admin
        $stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) Response::notFound('User not found');
        if ($user['role'] === 'admin') {
            Response::error('Cannot delete admin users', 403);
        }

        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);

        Response::success(null, 'User deleted');
        break;

    default:
        Response::error('Method not allowed', 405);
}
