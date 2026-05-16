import { compressImage } from './imageCompress';

const API_BASE = 'http://localhost/Bay%20Bakers%20Backend';

// ── Token helpers ──
const getToken = () => localStorage.getItem('bb_token');
const setToken = (token) => localStorage.setItem('bb_token', token);
const clearToken = () => localStorage.removeItem('bb_token');

// ── Generic fetch wrapper ──
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/${endpoint}`, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json.data;
}

// ── Data normalizers (snake_case → camelCase to match frontend) ──
function normalizeProduct(p) {
  return {
    id: String(p.id),
    name: p.name,
    category: p.category_name || '',
    categoryId: p.category_id,
    price: parseFloat(p.price),
    image: p.image || '',
    description: p.description || '',
    stock: parseInt(p.stock, 10),
    expiryDate: p.expiry_date || ''
  };
}

function normalizeOrder(o) {
  return {
    id: o.order_number || `ORD${String(o.id).padStart(3, '0')}`,
    dbId: o.id,
    customerName: o.customer_name,
    customerEmail: o.customer_email,
    customerPhone: o.customer_phone,
    items: (o.items || []).map(item => ({
      product: {
        id: String(item.product_id),
        name: item.product_name,
        price: parseFloat(item.product_price),
        image: item.product_image || ''
      },
      quantity: parseInt(item.quantity, 10)
    })),
    total: parseFloat(o.total),
    status: o.status || 'Pending',
    deadline: o.deadline || '',
    createdAt: o.created_at,
    deliveryAddress: o.delivery_address,
    paymentMethod: o.payment_method || 'COD',
    deliveryPerson: o.delivery_person || undefined,
    trackingNotes: o.tracking_notes
      ? o.tracking_notes.map(t => (typeof t === 'string' ? t : t.note))
      : ['Order received']
  };
}

function normalizeUser(u) {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    createdAt: u.created_at
  };
}

function normalizeFeedback(f) {
  return {
    id: String(f.id),
    customerName: f.customer_name,
    email: f.email,
    rating: parseInt(f.rating, 10),
    message: f.message,
    createdAt: f.created_at,
    status: f.status || 'New'
  };
}

function normalizeDeliveryStaff(d) {
  return {
    id: String(d.id),
    name: d.name,
    phone: d.phone,
    status: d.status,
    ordersDelivered: parseInt(d.orders_delivered, 10),
    currentOrderId: d.current_order_id || undefined
  };
}

function normalizeStaff(s) {
  return {
    id: String(s.id),
    name: s.name,
    email: s.email,
    phone: s.phone,
    role: s.role,
    status: s.status,
    joinedDate: s.joined_date,
    salary: s.salary ? parseFloat(s.salary) : 0
  };
}

function normalizeCategory(c) {
  return {
    id: String(c.id),
    name: c.name,
    description: c.description || ''
  };
}

// ══════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════
export async function apiLogin(email, password) {
  const data = await request('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  setToken(data.token);
  return normalizeUser(data.user);
}

export async function apiRegister(name, email, phone, password) {
  const data = await request('auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, password })
  });
  setToken(data.token);
  return normalizeUser(data.user);
}

export async function apiGetMe() {
  const data = await request('auth/me');
  return normalizeUser(data);
}

export function apiLogout() {
  clearToken();
}

export async function apiUploadImage(file) {
  // Resize + re-encode in the browser before sending to reduce bandwidth.
  const compressed = await compressImage(file, { maxDim: 1600, quality: 0.85 });

  const formData = new FormData();
  formData.append('image', compressed, compressed.name);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    body: formData
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Upload failed');
  return json.data.url;
}

// ══════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════
export async function apiGetProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await request(`products${qs ? '?' + qs : ''}`);
  return data.map(normalizeProduct);
}

export async function apiCreateProduct(product) {
  const data = await request('products', {
    method: 'POST',
    body: JSON.stringify({
      name: product.name,
      category_id: product.categoryId,
      price: product.price,
      image: product.image,
      description: product.description,
      stock: product.stock,
      expiry_date: product.expiryDate
    })
  });
  return normalizeProduct(data);
}

export async function apiUpdateProduct(id, updates) {
  const body = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.categoryId !== undefined) body.category_id = updates.categoryId;
  if (updates.price !== undefined) body.price = updates.price;
  if (updates.image !== undefined) body.image = updates.image;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.stock !== undefined) body.stock = updates.stock;
  if (updates.expiryDate !== undefined) body.expiry_date = updates.expiryDate;

  const data = await request(`products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return normalizeProduct(data);
}

export async function apiDeleteProduct(id) {
  await request(`products/${id}`, { method: 'DELETE' });
}

export async function apiUpdateStock(id, stock) {
  await request(`products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ stock })
  });
}

// ══════════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════════
export async function apiGetCategories() {
  const data = await request('categories');
  return data.map(normalizeCategory);
}

export async function apiCreateCategory(name, description) {
  const data = await request('categories', {
    method: 'POST',
    body: JSON.stringify({ name, description })
  });
  return normalizeCategory(data);
}

export async function apiUpdateCategory(id, updates) {
  const data = await request(`categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  return normalizeCategory(data);
}

export async function apiDeleteCategory(id) {
  await request(`categories/${id}`, { method: 'DELETE' });
}

// ══════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════
export async function apiGetOrders(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await request(`orders${qs ? '?' + qs : ''}`);
  return data.map(normalizeOrder);
}

export async function apiPlaceOrder(orderData) {
  const data = await request('orders', {
    method: 'POST',
    body: JSON.stringify({
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
      delivery_address: orderData.deliveryAddress,
      payment_method: orderData.paymentMethod,
      items: orderData.items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }))
    })
  });
  return normalizeOrder(data);
}

export async function apiUpdateOrderStatus(dbId, status, note) {
  await request(`orders/${dbId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note })
  });
}

export async function apiAssignDelivery(dbId, deliveryPerson) {
  await request(`orders/${dbId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ delivery_person: deliveryPerson })
  });
}

export async function apiCancelOrder(dbId) {
  await request(`orders/${dbId}/cancel`, { method: 'PATCH' });
}

// ══════════════════════════════════════════
// USERS (admin)
// ══════════════════════════════════════════
export async function apiGetUsers() {
  const data = await request('users');
  return data.map(normalizeUser);
}

export async function apiCreateUser(userData) {
  const data = await request('users', {
    method: 'POST',
    body: JSON.stringify({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role || 'customer',
      password: userData.password
    })
  });
  return normalizeUser(data);
}

export async function apiDeleteUser(id) {
  await request(`users/${id}`, { method: 'DELETE' });
}

// ══════════════════════════════════════════
// FEEDBACK
// ══════════════════════════════════════════
export async function apiGetFeedback() {
  const data = await request('feedback');
  return {
    feedback: data.feedback.map(normalizeFeedback),
    stats: data.stats
  };
}

export async function apiSubmitFeedback(feedbackData) {
  const data = await request('feedback', {
    method: 'POST',
    body: JSON.stringify({
      customer_name: feedbackData.customerName,
      email: feedbackData.email,
      rating: feedbackData.rating,
      message: feedbackData.message
    })
  });
  return normalizeFeedback(data);
}

export async function apiUpdateFeedbackStatus(id, status) {
  await request(`feedback/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

// ══════════════════════════════════════════
// DELIVERY STAFF (admin)
// ══════════════════════════════════════════
export async function apiGetDeliveryStaff() {
  const data = await request('delivery-staff');
  return data.map(normalizeDeliveryStaff);
}

export async function apiUpdateDeliveryStaffStatus(id, status, currentOrderId) {
  await request(`delivery-staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, current_order_id: currentOrderId })
  });
}

// ══════════════════════════════════════════
// STAFF MEMBERS (admin)
// ══════════════════════════════════════════
export async function apiGetStaff() {
  const data = await request('staff');
  return data.map(normalizeStaff);
}

export async function apiCreateStaff(staffData) {
  const data = await request('staff', {
    method: 'POST',
    body: JSON.stringify({
      name: staffData.name,
      email: staffData.email,
      phone: staffData.phone,
      role: staffData.role || 'Baker',
      status: staffData.status || 'Active',
      joined_date: staffData.joined_date || staffData.joinedDate,
      salary: staffData.salary,
      password: staffData.password
    })
  });
  return normalizeStaff(data);
}

export async function apiUpdateStaff(id, updates) {
  const body = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.email !== undefined) body.email = updates.email;
  if (updates.phone !== undefined) body.phone = updates.phone;
  if (updates.role !== undefined) body.role = updates.role;
  if (updates.status !== undefined) body.status = updates.status;
  if (updates.joinedDate !== undefined) body.joined_date = updates.joinedDate;
  if (updates.joined_date !== undefined) body.joined_date = updates.joined_date;
  if (updates.salary !== undefined) body.salary = updates.salary;
  if (updates.password) body.password = updates.password;

  const data = await request(`staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return normalizeStaff(data);
}

export async function apiDeleteStaff(id) {
  await request(`staff/${id}`, { method: 'DELETE' });
}

// ══════════════════════════════════════════
// WISHLIST (authenticated)
// ══════════════════════════════════════════
export async function apiGetWishlist() {
  const data = await request('wishlist');
  return data.map(item => String(item.product_id));
}

export async function apiToggleWishlist(productId) {
  await request('wishlist', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId })
  });
}

// ══════════════════════════════════════════
// DASHBOARD (admin)
// ══════════════════════════════════════════
export async function apiGetDashboard() {
  return await request('dashboard');
}

// ══════════════════════════════════════════
// SLIDER (admin)
// ══════════════════════════════════════════
export async function apiGetSlides() {
  return await request('slides');
}

export async function apiAddSlide(slideData) {
  return await request('slides', {
    method: 'POST',
    body: JSON.stringify(slideData)
  });
}

export async function apiDeleteSlide(id) {
  await request(`slides?id=${id}`, {
    method: 'DELETE'
  });
}

// ══════════════════════════════════════════
// ANNOUNCEMENTS
// ══════════════════════════════════════════
export async function apiGetAnnouncement() {
  return await request('announcements');
}

export async function apiUpdateAnnouncement(data) {
  return await request('announcements', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
