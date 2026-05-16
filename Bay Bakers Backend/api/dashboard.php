<?php

/**
 * Dashboard API (Admin)
 * GET /dashboard - Get dashboard stats
 */

Auth::requireRole(['admin']);

if ($method !== 'GET') {
    Response::error('Method not allowed', 405);
}

// Total revenue (delivered orders)
$stmt = $db->query("SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status = 'Delivered'");
$totalRevenue = $stmt->fetch()['revenue'];

// Active orders
$stmt = $db->query("SELECT COUNT(*) as cnt FROM orders WHERE status NOT IN ('Delivered', 'Cancelled')");
$activeOrders = $stmt->fetch()['cnt'];

// Total customers
$stmt = $db->query("SELECT COUNT(*) as cnt FROM users WHERE role = 'customer'");
$totalCustomers = $stmt->fetch()['cnt'];

// Low stock items
$stmt = $db->query("SELECT id, name, category_id, stock FROM products WHERE stock < 10 ORDER BY stock ASC");
$lowStockItems = $stmt->fetchAll();

// New feedback count
$stmt = $db->query("SELECT COUNT(*) as cnt FROM feedback WHERE status = 'New'");
$newFeedback = $stmt->fetch()['cnt'];

// Delivery stats
$stmt = $db->query("SELECT COUNT(*) as cnt FROM orders WHERE status = 'Out for Delivery'");
$activeDeliveries = $stmt->fetch()['cnt'];

$today = date('Y-m-d');
$stmt = $db->prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'Delivered' AND DATE(updated_at) = ?");
$stmt->execute([$today]);
$deliveredToday = $stmt->fetch()['cnt'];

$stmt = $db->query("SELECT COUNT(*) as cnt FROM delivery_staff WHERE status = 'Available'");
$availableStaff = $stmt->fetch()['cnt'];

// Orders by status (for pie chart)
$stmt = $db->query("
    SELECT status, COUNT(*) as count 
    FROM orders 
    WHERE status NOT IN ('Cancelled') 
    GROUP BY status
");
$ordersByStatus = $stmt->fetchAll();

// Recent orders
$stmt = $db->query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5");
$recentOrders = $stmt->fetchAll();

Response::success([
    'total_revenue'    => (float) $totalRevenue,
    'active_orders'    => (int) $activeOrders,
    'total_customers'  => (int) $totalCustomers,
    'low_stock_items'  => $lowStockItems,
    'new_feedback'     => (int) $newFeedback,
    'delivery_stats'   => [
        'active'          => (int) $activeDeliveries,
        'delivered_today' => (int) $deliveredToday,
        'available_staff' => (int) $availableStaff
    ],
    'orders_by_status' => $ordersByStatus,
    'recent_orders'    => $recentOrders
]);
