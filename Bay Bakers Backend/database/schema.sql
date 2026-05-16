-- ============================================
-- Bay Bakers Management System - Database Schema
-- MySQL 8.0+
-- ============================================

CREATE DATABASE IF NOT EXISTS bay_bakers;
USE bay_bakers;

-- ── USERS ──
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    role ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'customer',
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── CATEGORIES ──
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── PRODUCTS ──
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(500) DEFAULT NULL,
    description TEXT,
    stock INT NOT NULL DEFAULT 0,
    expiry_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── ORDERS ──
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT DEFAULT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(150) DEFAULT NULL,
    customer_phone VARCHAR(20) DEFAULT NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('Pending','Approved','In Progress','Out for Delivery','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
    deadline DATE DEFAULT NULL,
    delivery_address TEXT NOT NULL,
    payment_method ENUM('COD','QR','Cash','Card') NOT NULL DEFAULT 'COD',
    delivery_person VARCHAR(100) DEFAULT NULL,
    eta VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── ORDER ITEMS ──
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    product_image VARCHAR(500) DEFAULT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── ORDER TRACKING NOTES ──
CREATE TABLE order_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── FEEDBACK ──
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    message TEXT NOT NULL,
    status ENUM('New','Read','Resolved') NOT NULL DEFAULT 'New',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── DELIVERY STAFF ──
CREATE TABLE delivery_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status ENUM('Available','Busy','Off Duty') NOT NULL DEFAULT 'Available',
    orders_delivered INT NOT NULL DEFAULT 0,
    current_order_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (current_order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── STAFF MEMBERS ──
CREATE TABLE staff_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    role ENUM('Baker','Cashier','Manager','Delivery') NOT NULL DEFAULT 'Baker',
    status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    joined_date DATE NOT NULL,
    salary DECIMAL(10,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── WISHLIST ──
CREATE TABLE wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_wishlist (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ══════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_delivery_staff_status ON delivery_staff(status);
CREATE INDEX idx_staff_role ON staff_members(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ══════════════════════════════════════════
-- SEED DATA
-- ══════════════════════════════════════════

-- Users (passwords hashed with password_hash in PHP, plain text here for demo)
INSERT INTO users (name, email, phone, role, password) VALUES
('Admin User', 'admin@baybakers.com', '+1234567800', 'admin', '$2y$10$YourHashedPasswordHere1'),
('Staff Member', 'staff@baybakers.com', '+1234567801', 'staff', '$2y$10$YourHashedPasswordHere2'),
('Sarah Johnson', 'sarah@email.com', '+1234567890', 'customer', '$2y$10$YourHashedPasswordHere3'),
('Michael Chen', 'michael@email.com', '+1234567891', 'customer', '$2y$10$YourHashedPasswordHere4');

-- Categories
INSERT INTO categories (name, description) VALUES
('Breads', 'Fresh baked breads, baguettes, and loaves'),
('Cakes', 'Custom cakes and celebration desserts'),
('Pastries', 'Croissants, muffins, and sweet pastries'),
('Cookies', 'Freshly baked cookies and biscotti'),
('Special', 'Custom orders and seasonal specials');

-- Products
INSERT INTO products (name, category_id, price, image, description, stock, expiry_date) VALUES
('Sourdough Bread',      1, 8.99,  'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400', 'Artisan sourdough with crispy crust, slow-fermented 24 hours for deep flavour.', 24, '2026-05-17'),
('Chocolate Croissant',  3, 4.50,  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', 'Buttery layered croissant filled with premium dark chocolate.', 36, '2026-05-16'),
('Red Velvet Cake',      2, 45.00, 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400', 'Classic red velvet with velvety cream cheese frosting, made fresh daily.', 8, '2026-05-18'),
('Baguette',             1, 3.99,  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', 'Traditional French baguette, crispy outside and airy inside.', 32, '2026-05-16'),
('Blueberry Muffin',     3, 3.25,  'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400', 'Fluffy muffin packed with fresh blueberries and a sugar-crunch top.', 48, '2026-05-16'),
('Chocolate Chip Cookies',4, 12.99,'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400', 'Dozen freshly baked cookies with generous chocolate chunks.', 20, '2026-05-20'),
('Tiramisu Cake',        2, 38.00, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', 'Italian classic layered with espresso-soaked ladyfingers and mascarpone.', 6, '2026-05-17'),
('Cinnamon Rolls',       3, 5.50,  'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400', 'Warm, gooey cinnamon rolls glazed with luscious cream cheese icing.', 18, '2026-05-16'),
('Multigrain Bread',     1, 6.99,  'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400', 'Wholesome loaf packed with seeds and whole grains for nutritious eating.', 15, '2026-05-18'),
('Lemon Tart',           3, 6.75,  'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=400', 'Bright tangy lemon curd nestled in a crisp, buttery pastry shell.', 12, '2026-05-17'),
('Birthday Cake Special',5, 65.00, 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400', 'Custom decorated celebration cake, personalised to your design.', 3, '2026-05-19'),
('Almond Biscotti',      4, 8.99,  'https://images.unsplash.com/photo-1548848242-ae3e6632e4ca?w=400', 'Twice-baked Italian almond cookies, perfect with coffee.', 25, '2026-05-25');

-- Delivery Staff
INSERT INTO delivery_staff (name, phone, status, orders_delivered) VALUES
('John Ramos',    '+1234567810', 'Busy',      142),
('Maria Santos',  '+1234567811', 'Available',  98),
('Carlos Rivera', '+1234567812', 'Busy',      215),
('Lisa Park',     '+1234567813', 'Off Duty',   67);

-- Staff Members
INSERT INTO staff_members (name, email, phone, role, status, joined_date, salary) VALUES
('David Martinez',   'david.m@baybakers.com',  '+1234567820', 'Baker',    'Active',   '2025-01-10', 3500),
('Sophie Chen',      'sophie.c@baybakers.com',  '+1234567821', 'Baker',    'Active',   '2025-03-15', 3200),
('Robert Kim',       'robert.k@baybakers.com',  '+1234567822', 'Cashier',  'Active',   '2025-02-20', 2800),
('Emily Rodriguez',  'emily.r@baybakers.com',   '+1234567823', 'Manager',  'Active',   '2024-11-05', 4500),
('James Taylor',     'james.t@baybakers.com',   '+1234567824', 'Delivery', 'Active',   '2025-04-01', 2500),
('Lisa Wong',        'lisa.w@baybakers.com',     '+1234567825', 'Cashier',  'Inactive', '2024-08-12', 2800);

-- Feedback
INSERT INTO feedback (customer_name, email, rating, message, status) VALUES
('Sarah Johnson', 'sarah@email.com',   5, 'Amazing sourdough bread! Best in the city. Will definitely order again.', 'New'),
('Michael Chen',  'michael@email.com',  4, 'Great quality pastries. Delivery was on time. Would love more variety in cakes.', 'Read'),
('Emma Davis',    'emma@email.com',     5, 'The birthday cake was perfect! Everyone loved it. Thank you so much!', 'Resolved');
