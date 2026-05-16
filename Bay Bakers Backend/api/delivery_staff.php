<?php

/**
 * Delivery Staff API (Admin)
 * GET   /delivery-staff           - List all
 * PATCH /delivery-staff/{id}      - Update status
 */

Auth::requireRole(['admin']);

switch ($method) {
    case 'GET':
        $stmt = $db->query("SELECT * FROM delivery_staff ORDER BY name");
        Response::success($stmt->fetchAll());
        break;

    case 'PATCH':
        if (!$id) Response::validationError('Staff ID is required');

        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['status'])) {
            Response::validationError('Status is required');
        }

        // Check if exists first
        $stmt = $db->prepare("SELECT id FROM delivery_staff WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::notFound('Delivery staff not found');
        }

        $currentOrderId = ($data['status'] === 'Busy' && !empty($data['current_order_id']))
            ? (int)$data['current_order_id']
            : null;

        $stmt = $db->prepare("UPDATE delivery_staff SET status = ?, current_order_id = ? WHERE id = ?");
        $stmt->execute([$data['status'], $currentOrderId, $id]);

        Response::success(null, 'Delivery staff updated');
        break;

    default:
        Response::error('Method not allowed', 405);
}
