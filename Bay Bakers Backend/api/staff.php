<?php

/**
 * Staff Members API (Admin)
 * GET    /staff         - List all
 * POST   /staff         - Add staff
 * PUT    /staff/{id}    - Update staff
 * DELETE /staff/{id}    - Delete staff
 */

Auth::requireRole(['admin']);

switch ($method) {
    case 'GET':
        $stmt = $db->query("SELECT * FROM staff_members ORDER BY name");
        Response::success($stmt->fetchAll());
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name']) || empty($data['email']) || empty($data['phone']) || empty($data['joined_date'])) {
            Response::validationError('Name, email, phone, and joined_date are required');
        }

        $db->beginTransaction();
        try {
            // 1. Insert into staff_members table
            $stmt = $db->prepare("
                INSERT INTO staff_members (name, email, phone, role, status, joined_date, salary)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'],
                $data['role'] ?? 'Baker',
                $data['status'] ?? 'Active',
                $data['joined_date'],
                $data['salary'] ?? null
            ]);
            $newId = $db->lastInsertId();

            // Create / update login account in users table so the staff can sign in
            if (!empty($data['password'])) {
                $hashed = password_hash($data['password'], PASSWORD_DEFAULT);
                $check = $db->prepare("SELECT id FROM users WHERE email = ?");
                $check->execute([$data['email']]);
                if ($existing = $check->fetch()) {
                    $upd = $db->prepare("UPDATE users SET name=?, phone=?, role='staff', password=? WHERE id=?");
                    $upd->execute([$data['name'], $data['phone'], $hashed, $existing['id']]);
                } else {
                    $ins = $db->prepare("INSERT INTO users (name, email, phone, role, password) VALUES (?, ?, ?, 'staff', ?)");
                    $ins->execute([$data['name'], $data['email'], $data['phone'], $hashed]);
                }
            }

            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Failed to create staff: ' . $e->getMessage(), 500);
        }

        $stmt = $db->prepare("SELECT * FROM staff_members WHERE id = ?");
        $stmt->execute([$newId]);

        Response::created($stmt->fetch());
        break;

    case 'PUT':
        if (!$id) Response::validationError('Staff ID is required');

        $data = json_decode(file_get_contents('php://input'), true);

        // Get current staff email so we can sync the users record
        $cur = $db->prepare("SELECT email FROM staff_members WHERE id = ?");
        $cur->execute([$id]);
        $currentStaff = $cur->fetch();

        $stmt = $db->prepare("
            UPDATE staff_members SET 
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                role = COALESCE(?, role),
                status = COALESCE(?, status),
                joined_date = COALESCE(?, joined_date),
                salary = COALESCE(?, salary)
            WHERE id = ?
        ");
        $stmt->execute([
            $data['name'] ?? null,
            $data['email'] ?? null,
            $data['phone'] ?? null,
            $data['role'] ?? null,
            $data['status'] ?? null,
            $data['joined_date'] ?? null,
            $data['salary'] ?? null,
            $id
        ]);

        // Sync corresponding users row (match by old email)
        if ($currentStaff) {
            $userCheck = $db->prepare("SELECT id FROM users WHERE email = ?");
            $userCheck->execute([$currentStaff['email']]);
            $userRow = $userCheck->fetch();

            if ($userRow) {
                $sets = [];
                $vals = [];
                if (!empty($data['name']))  { $sets[] = "name = ?";  $vals[] = $data['name']; }
                if (!empty($data['email'])) { $sets[] = "email = ?"; $vals[] = $data['email']; }
                if (!empty($data['phone'])) { $sets[] = "phone = ?"; $vals[] = $data['phone']; }
                if (!empty($data['password'])) {
                    $sets[] = "password = ?";
                    $vals[] = password_hash($data['password'], PASSWORD_DEFAULT);
                }
                if (!empty($sets)) {
                    $vals[] = $userRow['id'];
                    $upd = $db->prepare("UPDATE users SET " . implode(', ', $sets) . " WHERE id = ?");
                    $upd->execute($vals);
                }
            } elseif (!empty($data['password'])) {
                // No user yet but admin set a password now — create the login
                $email = $data['email'] ?? $currentStaff['email'];
                $name  = $data['name']  ?? '';
                $phone = $data['phone'] ?? '';
                $hashed = password_hash($data['password'], PASSWORD_DEFAULT);
                $ins = $db->prepare("INSERT INTO users (name, email, phone, role, password) VALUES (?, ?, ?, 'staff', ?)");
                $ins->execute([$name, $email, $phone, $hashed]);
            }
        }

        $stmt = $db->prepare("SELECT * FROM staff_members WHERE id = ?");
        $stmt->execute([$id]);

        Response::success($stmt->fetch(), 'Staff member updated');
        break;

    case 'DELETE':
        if (!$id) Response::validationError('Staff ID is required');

        // Capture email first to remove the matching user account
        $cur = $db->prepare("SELECT email FROM staff_members WHERE id = ?");
        $cur->execute([$id]);
        $row = $cur->fetch();

        $stmt = $db->prepare("DELETE FROM staff_members WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            Response::notFound('Staff member not found');
        }

        if ($row && !empty($row['email'])) {
            $del = $db->prepare("DELETE FROM users WHERE email = ? AND role = 'staff'");
            $del->execute([$row['email']]);
        }

        Response::success(null, 'Staff member deleted');
        break;

    default:
        Response::error('Method not allowed', 405);
}
