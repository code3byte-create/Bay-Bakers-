<?php

class Auth
{
    private static $secretKey = 'bay_bakers_secret_key_change_in_production';

    /**
     * Generate a simple token (base64 encoded JSON with expiry)
     */
    public static function generateToken($userId, $role)
    {
        $payload = [
            'user_id' => $userId,
            'role'    => $role,
            'exp'     => time() + (24 * 60 * 60) // 24 hours
        ];

        $encoded = base64_encode(json_encode($payload));
        $signature = hash_hmac('sha256', $encoded, self::$secretKey);

        return $encoded . '.' . $signature;
    }

    /**
     * Verify and decode token
     */
    public static function verifyToken($token)
    {
        $parts = explode('.', $token);
        if (count($parts) !== 2) {
            return false;
        }

        [$encoded, $signature] = $parts;
        $expectedSignature = hash_hmac('sha256', $encoded, self::$secretKey);

        if (!hash_equals($expectedSignature, $signature)) {
            return false;
        }

        $payload = json_decode(base64_decode($encoded), true);
        if (!$payload || $payload['exp'] < time()) {
            return false;
        }

        return $payload;
    }

    /**
     * Get authenticated user from Authorization header
     */
    public static function getUser()
    {
        $authHeader = '';

        // Try multiple sources — Apache can place it differently
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } else {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = substr($authHeader, 7);
        return self::verifyToken($token);
    }

    /**
     * Require authentication - exits with 401 if not authenticated
     */
    public static function require()
    {
        $user = self::getUser();
        if (!$user) {
            Response::unauthorized('Authentication required');
        }
        return $user;
    }

    /**
     * Require specific role
     */
    public static function requireRole($roles)
    {
        $payload = self::require();
        if (is_string($roles)) {
            $roles = [$roles];
        }
        
        $allowedRoles = array_map('strtolower', $roles);
        $tokenRole = strtolower($payload['role'] ?? '');

        // 1. First check the token role (Fast)
        if (in_array($tokenRole, $allowedRoles)) {
            return $payload;
        }

        // 2. If token role fails, check Database (Real-time sync)
        // This handles cases where a user was promoted to admin but hasn't re-logged in
        try {
            require_once __DIR__ . '/../config/database.php';
            $db = (new Database())->getConnection();
            $stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
            $stmt->execute([$payload['user_id']]);
            $realRole = strtolower($stmt->fetchColumn() ?: '');

            if (in_array($realRole, $allowedRoles)) {
                return $payload; // User has the role in DB, proceed
            }
        } catch (Exception $e) {
            // Fallback to error if DB check fails
        }

        Response::error('Insufficient permissions', 403);
    }
}
