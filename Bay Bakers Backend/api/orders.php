<?php

/**
 * Orders API
 * GET    /orders                    - List orders (admin: all, customer: own)
 * GET    /orders/{id}               - Get single order with items + tracking
 * POST   /orders                    - Place order (customer/guest)
 * PATCH  /orders/{id}/status        - Update status (admin/staff)
 * PATCH  /orders/{id}/assign        - Assign delivery person (admin)
 * PATCH  /orders/{id}/cancel        - Cancel order (customer/admin)
 */

switch ($method) {
    // ── LIST / GET ONE ──
    case 'GET':
        if ($id) {
            // Get order
            $stmt = $db->prepare("SELECT * FROM orders WHERE id = ?");
            $stmt->execute([$id]);
            $order = $stmt->fetch();

            if (!$order) Response::notFound('Order not found');

            // Get items
            $stmt = $db->prepare("SELECT * FROM order_items WHERE order_id = ?");
            $stmt->execute([$id]);
            $order['items'] = $stmt->fetchAll();

            // Get tracking
            $stmt = $db->prepare("SELECT * FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC");
            $stmt->execute([$id]);
            $order['tracking_notes'] = $stmt->fetchAll();

            Response::success($order);
        } else {
            $authUser = Auth::getUser();
            $sql = "SELECT * FROM orders WHERE 1=1";
            $params = [];

            // Customers only see own orders
            if ($authUser && $authUser['role'] === 'customer') {
                $stmt2 = $db->prepare("SELECT email FROM users WHERE id = ?");
                $stmt2->execute([$authUser['user_id']]);
                $userEmail = $stmt2->fetchColumn();

                $sql .= " AND customer_email = ?";
                $params[] = $userEmail;
            }

            if (!empty($_GET['status']) && $_GET['status'] !== 'All') {
                $sql .= " AND status = ?";
                $params[] = $_GET['status'];
            }
            if (!empty($_GET['search'])) {
                $sql .= " AND (customer_name LIKE ? OR order_number LIKE ?)";
                $search = '%' . $_GET['search'] . '%';
                $params[] = $search;
                $params[] = $search;
            }

            $sql .= " ORDER BY created_at DESC";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $orders = $stmt->fetchAll();

            // Attach items to each order
            foreach ($orders as &$order) {
                $stmt = $db->prepare("SELECT * FROM order_items WHERE order_id = ?");
                $stmt->execute([$order['id']]);
                $order['items'] = $stmt->fetchAll();
            }

            Response::success($orders);
        }
        break;

    // ── PLACE ORDER ──
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['customer_name']) || empty($data['delivery_address']) || empty($data['items'])) {
            Response::validationError('customer_name, delivery_address, and items are required');
        }

        $authUser = Auth::getUser();
        $customerId = null;
        if ($authUser) {
            $customerId = $authUser['user_id'];
        }

        // Calculate total
        $total = 0;
        $orderItems = [];
        foreach ($data['items'] as $item) {
            $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$item['product_id']]);
            $product = $stmt->fetch();

            if (!$product) {
                Response::error("Product ID {$item['product_id']} not found");
            }
            if ($product['stock'] < $item['quantity']) {
                Response::error("Insufficient stock for '{$product['name']}'");
            }

            $subtotal = $product['price'] * $item['quantity'];
            $total += $subtotal;

            $orderItems[] = [
                'product_id'    => $product['id'],
                'product_name'  => $product['name'],
                'product_price' => $product['price'],
                'product_image' => $product['image'],
                'quantity'      => $item['quantity'],
                'subtotal'      => $subtotal
            ];
        }

        // Generate order number
        $stmt = $db->query("SELECT COUNT(*) as cnt FROM orders");
        $count = $stmt->fetch()['cnt'];
        $orderNumber = 'ORD' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

        $deadline = date('Y-m-d', strtotime('+2 days'));

        $db->beginTransaction();

        try {
            // Insert order
            $stmt = $db->prepare("
                INSERT INTO orders (order_number, customer_id, customer_name, customer_email, customer_phone, total, delivery_address, payment_method, deadline)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $orderNumber,
                $customerId,
                $data['customer_name'],
                $data['customer_email'] ?? null,
                $data['customer_phone'] ?? null,
                $total,
                $data['delivery_address'],
                $data['payment_method'] ?? 'COD',
                $deadline
            ]);
            $orderId = $db->lastInsertId();

            // Insert order items
            $stmt = $db->prepare("
                INSERT INTO order_items (order_id, product_id, product_name, product_price, product_image, quantity, subtotal)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            foreach ($orderItems as $item) {
                $stmt->execute([
                    $orderId,
                    $item['product_id'],
                    $item['product_name'],
                    $item['product_price'],
                    $item['product_image'],
                    $item['quantity'],
                    $item['subtotal']
                ]);
            }

            // Add tracking note
            $stmt = $db->prepare("INSERT INTO order_tracking (order_id, note) VALUES (?, 'Order received')");
            $stmt->execute([$orderId]);

            // Reduce stock
            foreach ($data['items'] as $item) {
                $stmt = $db->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
                $stmt->execute([$item['quantity'], $item['product_id']]);
            }

            $db->commit();

            // Return created order
            $stmt = $db->prepare("SELECT * FROM orders WHERE id = ?");
            $stmt->execute([$orderId]);
            $order = $stmt->fetch();
            $order['items'] = $orderItems;

            Response::created($order, 'Order placed successfully');

        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Failed to place order: ' . $e->getMessage(), 500);
        }
        break;

    // ── UPDATE STATUS / ASSIGN / CANCEL ──
    case 'PATCH':
        if (!$id) Response::validationError('Order ID is required');
        $data = json_decode(file_get_contents('php://input'), true);

        // /orders/{id}/status
        if ($action === 'status') {
            Auth::requireRole(['admin', 'staff']);

            if (empty($data['status'])) {
                Response::validationError('Status is required');
            }

            $note = $data['note'] ?? "Status changed to {$data['status']}";

            $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->execute([$data['status'], $id]);

            $stmt = $db->prepare("INSERT INTO order_tracking (order_id, note) VALUES (?, ?)");
            $stmt->execute([$id, $note]);

            Response::success(null, 'Order status updated');
        }

        // /orders/{id}/assign
        elseif ($action === 'assign') {
            Auth::requireRole(['admin']);

            if (empty($data['delivery_person'])) {
                Response::validationError('Delivery person name is required');
            }

            $stmt = $db->prepare("UPDATE orders SET delivery_person = ?, status = 'Out for Delivery' WHERE id = ?");
            $stmt->execute([$data['delivery_person'], $id]);

            $note = "Assigned to {$data['delivery_person']} for delivery";
            $stmt = $db->prepare("INSERT INTO order_tracking (order_id, note) VALUES (?, ?)");
            $stmt->execute([$id, $note]);

            Response::success(null, 'Delivery person assigned');
        }

        // /orders/{id}/cancel
        elseif ($action === 'cancel') {
            $stmt = $db->prepare("SELECT * FROM orders WHERE id = ?");
            $stmt->execute([$id]);
            $order = $stmt->fetch();

            if (!$order) Response::notFound('Order not found');
            if (!in_array($order['status'], ['Pending', 'Approved'])) {
                Response::error('Only Pending or Approved orders can be cancelled');
            }

            $db->beginTransaction();
            try {
                $stmt = $db->prepare("UPDATE orders SET status = 'Cancelled' WHERE id = ?");
                $stmt->execute([$id]);

                $stmt = $db->prepare("INSERT INTO order_tracking (order_id, note) VALUES (?, 'Order cancelled')");
                $stmt->execute([$id]);

                // Restore stock
                $stmt = $db->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
                $stmt->execute([$id]);
                $items = $stmt->fetchAll();

                foreach ($items as $item) {
                    $stmt = $db->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
                    $stmt->execute([$item['quantity'], $item['product_id']]);
                }

                $db->commit();
                Response::success(null, 'Order cancelled');
            } catch (Exception $e) {
                $db->rollBack();
                Response::error('Failed to cancel: ' . $e->getMessage(), 500);
            }
        } else {
            Response::notFound('Order action not found');
        }
        break;

    default:
        Response::error('Method not allowed', 405);
}
