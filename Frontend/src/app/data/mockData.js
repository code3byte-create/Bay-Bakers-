export const mockProducts = [
  {
    id: 'p1',
    name: 'Sourdough Bread',
    category: 'Breads',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400',
    description: 'Artisan sourdough with crispy crust, slow-fermented 24 hours for deep flavour.',
    stock: 24,
    expiryDate: '2026-05-17'
  },
  {
    id: 'p2',
    name: 'Chocolate Croissant',
    category: 'Pastries',
    price: 4.50,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
    description: 'Buttery layered croissant filled with premium dark chocolate.',
    stock: 36,
    expiryDate: '2026-05-16'
  },
  {
    id: 'p3',
    name: 'Red Velvet Cake',
    category: 'Cakes',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400',
    description: 'Classic red velvet with velvety cream cheese frosting, made fresh daily.',
    stock: 8,
    expiryDate: '2026-05-18'
  },
  {
    id: 'p4',
    name: 'Baguette',
    category: 'Breads',
    price: 3.99,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    description: 'Traditional French baguette, crispy outside and airy inside.',
    stock: 32,
    expiryDate: '2026-05-16'
  },
  {
    id: 'p5',
    name: 'Blueberry Muffin',
    category: 'Pastries',
    price: 3.25,
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400',
    description: 'Fluffy muffin packed with fresh blueberries and a sugar-crunch top.',
    stock: 48,
    expiryDate: '2026-05-16'
  },
  {
    id: 'p6',
    name: 'Chocolate Chip Cookies',
    category: 'Cookies',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400',
    description: 'Dozen freshly baked cookies with generous chocolate chunks.',
    stock: 20,
    expiryDate: '2026-05-20'
  },
  {
    id: 'p7',
    name: 'Tiramisu Cake',
    category: 'Cakes',
    price: 38.00,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    description: 'Italian classic layered with espresso-soaked ladyfingers and mascarpone.',
    stock: 6,
    expiryDate: '2026-05-17'
  },
  {
    id: 'p8',
    name: 'Cinnamon Rolls',
    category: 'Pastries',
    price: 5.50,
    image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400',
    description: 'Warm, gooey cinnamon rolls glazed with luscious cream cheese icing.',
    stock: 18,
    expiryDate: '2026-05-16'
  },
  {
    id: 'p9',
    name: 'Multigrain Bread',
    category: 'Breads',
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400',
    description: 'Wholesome loaf packed with seeds and whole grains for nutritious eating.',
    stock: 15,
    expiryDate: '2026-05-18'
  },
  {
    id: 'p10',
    name: 'Lemon Tart',
    category: 'Pastries',
    price: 6.75,
    image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=400',
    description: 'Bright tangy lemon curd nestled in a crisp, buttery pastry shell.',
    stock: 12,
    expiryDate: '2026-05-17'
  },
  {
    id: 'p11',
    name: 'Birthday Cake Special',
    category: 'Special',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400',
    description: 'Custom decorated celebration cake, personalised to your design.',
    stock: 3,
    expiryDate: '2026-05-19'
  },
  {
    id: 'p12',
    name: 'Almond Biscotti',
    category: 'Cookies',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1548848242-ae3e6632e4ca?w=400',
    description: 'Twice-baked Italian almond cookies, perfect with coffee.',
    stock: 25,
    expiryDate: '2026-05-25'
  }
];

export const mockOrders = [
  {
    id: 'ORD001',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah@email.com',
    customerPhone: '+1234567890',
    items: [
      { product: mockProducts[2], quantity: 1 },
      { product: mockProducts[5], quantity: 2 }
    ],
    total: 70.98,
    status: 'Pending',
    deadline: '2026-05-16',
    createdAt: '2026-05-15T08:30:00',
    deliveryAddress: '123 Oak Street, Bay City',
    paymentMethod: 'COD',
    trackingNotes: ['Order received']
  },
  {
    id: 'ORD002',
    customerName: 'Michael Chen',
    customerEmail: 'michael@email.com',
    customerPhone: '+1234567891',
    items: [
      { product: mockProducts[0], quantity: 2 },
      { product: mockProducts[3], quantity: 3 }
    ],
    total: 29.95,
    status: 'Out for Delivery',
    deadline: '2026-05-15',
    createdAt: '2026-05-14T14:20:00',
    deliveryAddress: '456 Maple Avenue, Bay City',
    paymentMethod: 'QR',
    deliveryPerson: 'John Ramos',
    eta: '30 mins',
    trackingNotes: [
      'Order received',
      'Order approved',
      'Preparing order',
      'Out for delivery - ETA 30 mins'
    ]
  },
  {
    id: 'ORD003',
    customerName: 'Emma Davis',
    customerEmail: 'emma@email.com',
    customerPhone: '+1234567892',
    items: [
      { product: mockProducts[10], quantity: 1 }
    ],
    total: 65.00,
    status: 'In Progress',
    deadline: '2026-05-17',
    createdAt: '2026-05-13T10:15:00',
    deliveryAddress: '789 Pine Road, Bay City',
    paymentMethod: 'COD',
    trackingNotes: [
      'Order received',
      'Order approved',
      'Baking in progress'
    ]
  },
  {
    id: 'ORD004',
    customerName: 'James Wilson',
    customerEmail: 'james@email.com',
    customerPhone: '+1234567893',
    items: [
      { product: mockProducts[1], quantity: 6 },
      { product: mockProducts[4], quantity: 4 }
    ],
    total: 40.00,
    status: 'Delivered',
    deadline: '2026-05-14',
    createdAt: '2026-05-13T09:00:00',
    deliveryAddress: '321 Birch Lane, Bay City',
    paymentMethod: 'QR',
    deliveryPerson: 'Maria Santos',
    trackingNotes: [
      'Order received',
      'Order approved',
      'Preparing order',
      'Out for delivery',
      'Delivered successfully'
    ]
  },
  {
    id: 'ORD005',
    customerName: 'Priya Sharma',
    customerEmail: 'priya@email.com',
    customerPhone: '+1234567894',
    items: [
      { product: mockProducts[6], quantity: 1 },
      { product: mockProducts[7], quantity: 2 }
    ],
    total: 49.00,
    status: 'Out for Delivery',
    deadline: '2026-05-15',
    createdAt: '2026-05-15T07:45:00',
    deliveryAddress: '55 Seaview Drive, Bay City',
    paymentMethod: 'COD',
    deliveryPerson: 'Carlos Rivera',
    eta: '45 mins',
    trackingNotes: [
      'Order received',
      'Order approved',
      'Preparing order',
      'Out for delivery'
    ]
  },
  {
    id: 'ORD006',
    customerName: 'Tom Baker',
    customerEmail: 'tom@email.com',
    customerPhone: '+1234567895',
    items: [
      { product: mockProducts[0], quantity: 1 },
      { product: mockProducts[5], quantity: 1 }
    ],
    total: 21.98,
    status: 'Delivered',
    deadline: '2026-05-14',
    createdAt: '2026-05-14T06:00:00',
    deliveryAddress: '10 Harbor View, Bay City',
    paymentMethod: 'QR',
    deliveryPerson: 'John Ramos',
    trackingNotes: [
      'Order received',
      'Order approved',
      'Preparing order',
      'Out for delivery',
      'Delivered successfully'
    ]
  }
];

export const mockUsers = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@baybakers.com',
    phone: '+1234567800',
    role: 'admin',
    password: 'admin123',
    createdAt: '2026-01-01T00:00:00'
  },
  {
    id: 'u2',
    name: 'Staff Member',
    email: 'staff@baybakers.com',
    phone: '+1234567801',
    role: 'staff',
    password: 'staff123',
    createdAt: '2026-01-15T00:00:00'
  },
  {
    id: 'u3',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    phone: '+1234567890',
    role: 'customer',
    password: 'customer123',
    createdAt: '2026-02-10T00:00:00'
  },
  {
    id: 'u4',
    name: 'Michael Chen',
    email: 'michael@email.com',
    phone: '+1234567891',
    role: 'customer',
    password: 'customer123',
    createdAt: '2026-03-05T00:00:00'
  }
];

export const mockFeedback = [
  {
    id: 'f1',
    customerName: 'Sarah Johnson',
    email: 'sarah@email.com',
    rating: 5,
    message: 'Amazing sourdough bread! Best in the city. Will definitely order again.',
    createdAt: '2026-05-14T16:30:00',
    status: 'New'
  },
  {
    id: 'f2',
    customerName: 'Michael Chen',
    email: 'michael@email.com',
    rating: 4,
    message: 'Great quality pastries. Delivery was on time. Would love more variety in cakes.',
    createdAt: '2026-05-13T11:20:00',
    status: 'Read'
  },
  {
    id: 'f3',
    customerName: 'Emma Davis',
    email: 'emma@email.com',
    rating: 5,
    message: 'The birthday cake was perfect! Everyone loved it. Thank you so much!',
    createdAt: '2026-05-12T14:45:00',
    status: 'Resolved'
  }
];

export const mockDeliveryStaff = [
  {
    id: 'd1',
    name: 'John Ramos',
    phone: '+1234567810',
    status: 'Busy',
    ordersDelivered: 142,
    currentOrderId: 'ORD002'
  },
  {
    id: 'd2',
    name: 'Maria Santos',
    phone: '+1234567811',
    status: 'Available',
    ordersDelivered: 98
  },
  {
    id: 'd3',
    name: 'Carlos Rivera',
    phone: '+1234567812',
    status: 'Busy',
    ordersDelivered: 215,
    currentOrderId: 'ORD005'
  },
  {
    id: 'd4',
    name: 'Lisa Park',
    phone: '+1234567813',
    status: 'Off Duty',
    ordersDelivered: 67
  }
];

export const mockCategories = [
  {
    id: 'cat1',
    name: 'Breads',
    description: 'Fresh baked breads, baguettes, and loaves'
  },
  {
    id: 'cat2',
    name: 'Cakes',
    description: 'Custom cakes and celebration desserts'
  },
  {
    id: 'cat3',
    name: 'Pastries',
    description: 'Croissants, muffins, and sweet pastries'
  },
  {
    id: 'cat4',
    name: 'Cookies',
    description: 'Freshly baked cookies and biscotti'
  },
  {
    id: 'cat5',
    name: 'Special',
    description: 'Custom orders and seasonal specials'
  }
];

export const mockStaff = [
  {
    id: 'staff1',
    name: 'David Martinez',
    email: 'david.m@baybakers.com',
    phone: '+1234567820',
    role: 'Baker',
    status: 'Active',
    joinedDate: '2025-01-10',
    salary: 3500
  },
  {
    id: 'staff2',
    name: 'Sophie Chen',
    email: 'sophie.c@baybakers.com',
    phone: '+1234567821',
    role: 'Baker',
    status: 'Active',
    joinedDate: '2025-03-15',
    salary: 3200
  },
  {
    id: 'staff3',
    name: 'Robert Kim',
    email: 'robert.k@baybakers.com',
    phone: '+1234567822',
    role: 'Cashier',
    status: 'Active',
    joinedDate: '2025-02-20',
    salary: 2800
  },
  {
    id: 'staff4',
    name: 'Emily Rodriguez',
    email: 'emily.r@baybakers.com',
    phone: '+1234567823',
    role: 'Manager',
    status: 'Active',
    joinedDate: '2024-11-05',
    salary: 4500
  },
  {
    id: 'staff5',
    name: 'James Taylor',
    email: 'james.t@baybakers.com',
    phone: '+1234567824',
    role: 'Delivery',
    status: 'Active',
    joinedDate: '2025-04-01',
    salary: 2500
  },
  {
    id: 'staff6',
    name: 'Lisa Wong',
    email: 'lisa.w@baybakers.com',
    phone: '+1234567825',
    role: 'Cashier',
    status: 'Inactive',
    joinedDate: '2024-08-12',
    salary: 2800
  }
];
