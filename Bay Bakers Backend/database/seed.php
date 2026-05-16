<?php

/**
 * Seed Script - Run this once after importing schema.sql
 * Updates the demo user passwords with proper bcrypt hashes.
 *
 * Usage: php seed.php
 */

require_once __DIR__ . '/../config/database.php';

$db = (new Database())->getConnection();

$users = [
    ['email' => 'admin@baybakers.com',  'password' => 'admin123'],
    ['email' => 'staff@baybakers.com',  'password' => 'staff123'],
    ['email' => 'sarah@email.com',      'password' => 'customer123'],
    ['email' => 'michael@email.com',    'password' => 'customer123'],
];

$stmt = $db->prepare("UPDATE users SET password = ? WHERE email = ?");

foreach ($users as $user) {
    $hash = password_hash($user['password'], PASSWORD_DEFAULT);
    $stmt->execute([$hash, $user['email']]);
    echo "Updated: {$user['email']}\n";
}

echo "\nAll passwords updated successfully!\n";
echo "\nDemo Accounts:\n";
echo "  Admin:    admin@baybakers.com / admin123\n";
echo "  Staff:    staff@baybakers.com / staff123\n";
echo "  Customer: sarah@email.com / customer123\n";
echo "  Customer: michael@email.com / customer123\n";
