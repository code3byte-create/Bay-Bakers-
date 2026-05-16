<?php

/**
 * Auth API
 * POST /auth/login    - Login
 * POST /auth/register - Register
 * GET  /auth/me       - Get current user
 */

switch ($method) {
    // ── LOGIN ──
    case 'POST':
        if ($id === 'login') {
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['email']) || empty($data['password'])) {
                Response::validationError('Email and password are required');
            }

            $stmt = $db->prepare("SELECT id, name, email, phone, role, password FROM users WHERE email = ?");
            $stmt->execute([$data['email']]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($data['password'], $user['password'])) {
                Response::unauthorized('Invalid email or password');
            }

            $token = Auth::generateToken($user['id'], $user['role']);
            unset($user['password']);

            Response::success([
                'user'  => $user,
                'token' => $token
            ], 'Login successful');
        }

        // ── REGISTER ──
        elseif ($id === 'register') {
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['name']) || empty($data['email']) || empty($data['phone']) || empty($data['password'])) {
                Response::validationError('Name, email, phone, and password are required');
            }

            // Check if email exists
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$data['email']]);
            if ($stmt->fetch()) {
                Response::error('Email already exists', 409);
            }

            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

            $stmt = $db->prepare("INSERT INTO users (name, email, phone, role, password) VALUES (?, ?, ?, 'customer', ?)");
            $stmt->execute([$data['name'], $data['email'], $data['phone'], $hashedPassword]);

            $userId = $db->lastInsertId();
            $token = Auth::generateToken($userId, 'customer');

            $stmt = $db->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            Response::created([
                'user'  => $user,
                'token' => $token
            ], 'Registration successful');
        } else {
            Response::notFound('Auth endpoint not found');
        }
        break;

    // ── GET CURRENT USER ──
    case 'GET':
        if ($id === 'me') {
            $authUser = Auth::require();

            $stmt = $db->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?");
            $stmt->execute([$authUser['user_id']]);
            $user = $stmt->fetch();

            if (!$user) {
                Response::notFound('User not found');
            }

            Response::success($user);
        } else {
            Response::notFound('Auth endpoint not found');
        }
        break;

    default:
        Response::error('Method not allowed', 405);
}
