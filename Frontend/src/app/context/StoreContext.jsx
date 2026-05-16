import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiLogin, apiRegister, apiLogout, apiGetMe,
  apiGetProducts, apiCreateProduct, apiUpdateProduct, apiDeleteProduct, apiUpdateStock,
  apiGetCategories, apiCreateCategory, apiUpdateCategory, apiDeleteCategory,
  apiGetOrders, apiPlaceOrder, apiUpdateOrderStatus, apiAssignDelivery, apiCancelOrder,
  apiGetUsers, apiCreateUser, apiDeleteUser,
  apiGetFeedback, apiSubmitFeedback, apiUpdateFeedbackStatus,
  apiGetDeliveryStaff, apiUpdateDeliveryStaffStatus,
  apiGetStaff, apiCreateStaff, apiUpdateStaff, apiDeleteStaff,
  apiToggleWishlist, apiGetWishlist,
  apiGetSlides, apiAddSlide, apiDeleteSlide,
  apiGetAnnouncement, apiUpdateAnnouncement
} from '../services/api';

const StoreContext = createContext(undefined);

export const StoreProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [categories, setCategories] = useState([]);
  const [staff, setStaff] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [slides, setSlides] = useState([]);
  const [announcement, setAnnouncement] = useState({ message: '', is_active: 1 });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = currentUser !== null;

  // ── Load initial public data ──
  const refreshProducts = useCallback(async () => {
    try { setProducts(await apiGetProducts()); } catch (e) { console.error('Products fetch error:', e); }
  }, []);

  const refreshCategories = useCallback(async () => {
    try { setCategories(await apiGetCategories()); } catch (e) { console.error('Categories fetch error:', e); }
  }, []);

  const refreshOrders = useCallback(async () => {
    try { setOrders(await apiGetOrders()); } catch (e) { console.error('Orders fetch error:', e); }
  }, []);

  const refreshUsers = useCallback(async () => {
    try { setUsers(await apiGetUsers()); } catch (e) { console.error('Users fetch error:', e); }
  }, []);

  const refreshFeedback = useCallback(async () => {
    try {
      const data = await apiGetFeedback();
      setFeedback(data.feedback);
    } catch (e) { console.error('Feedback fetch error:', e); }
  }, []);

  const refreshDeliveryStaff = useCallback(async () => {
    try { setDeliveryStaff(await apiGetDeliveryStaff()); } catch (e) { console.error('Delivery staff fetch error:', e); }
  }, []);

  const refreshAnnouncement = useCallback(async () => {
    try { setAnnouncement(await apiGetAnnouncement()); } catch (e) { console.error('Announcement fetch error:', e); }
  }, []);

  const updateAnnouncement = async (data) => {
    await apiUpdateAnnouncement(data);
    refreshAnnouncement();
  };

  const refreshStaff = useCallback(async () => {
    try { setStaff(await apiGetStaff()); } catch (e) { console.error('Staff fetch error:', e); }
  }, []);

  const refreshWishlist = useCallback(async () => {
    try { setWishlist(await apiGetWishlist()); } catch (e) { console.error('Wishlist fetch error:', e); }
  }, []);

  const refreshSlides = useCallback(async () => {
    try { setSlides(await apiGetSlides()); } catch (e) { console.error('Slides fetch error:', e); }
  }, []);

  // ── Bootstrap: load products + categories, restore session ──
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([refreshProducts(), refreshCategories(), refreshSlides()]);

      // Try restoring session from stored token
      const token = localStorage.getItem('bb_token');
      if (token) {
        try {
          const user = await apiGetMe();
          setCurrentUser(user);
        } catch {
          localStorage.removeItem('bb_token');
        }
      }
      setLoading(false);
    };
    init();
    refreshSlides();
    refreshAnnouncement();
  }, [refreshProducts, refreshCategories, refreshSlides, refreshAnnouncement]);

  // ── When user logs in/out, load role-specific data ──
  useEffect(() => {
    if (!currentUser) return;
    refreshOrders();
    if (currentUser.role === 'admin') {
      refreshUsers();
      refreshFeedback();
      refreshDeliveryStaff();
      refreshStaff();
    }
    if (isLoggedIn) {
      refreshWishlist();
    }
  }, [currentUser, isLoggedIn, refreshOrders, refreshUsers, refreshFeedback, refreshDeliveryStaff, refreshStaff, refreshWishlist]);

  // ── Cart (local state only) ──
  const addToCart = (product, quantity) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  // ── Orders ──
  const placeOrder = async (customerName, deliveryAddress, paymentMethod, email, phone) => {
    try {
      await apiPlaceOrder({
        customerName,
        customerEmail: email || currentUser?.email,
        customerPhone: phone || currentUser?.phone,
        deliveryAddress,
        paymentMethod,
        items: cart
      });
      clearCart();
      await Promise.all([refreshOrders(), refreshProducts()]);
    } catch (e) { console.error('Place order error:', e); throw e; }
  };

  // POS sales: create a real order so revenue + history are tracked.
  // Backend deducts stock automatically inside the order transaction.
  const placePOSSale = async ({ items, customerName, customerPhone, paymentMethod }) => {
    const order = await apiPlaceOrder({
      customerName: customerName || 'Walk-in Customer',
      customerEmail: null,
      customerPhone: customerPhone || null,
      deliveryAddress: 'In-store (POS)',
      paymentMethod: paymentMethod || 'Cash',
      items: items.map(it => ({ product: it.product, quantity: it.quantity }))
    });
    // Mark as Delivered immediately — POS sales are completed at the counter
    if (order?.dbId || order?.id) {
      try {
        await apiUpdateOrderStatus(order.dbId || order.id, 'Delivered', 'POS sale completed');
      } catch (err) {
        console.warn('Could not auto-complete POS order:', err);
      }
    }
    await Promise.all([refreshOrders(), refreshProducts()]);
    return order;
  };

  const updateOrderStatus = async (orderId, status, note) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const dbId = order?.dbId || orderId;
      await apiUpdateOrderStatus(dbId, status, note);
      await refreshOrders();
    } catch (e) { console.error('Update order status error:', e); }
  };

  const assignDeliveryPerson = async (orderId, personName) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const dbId = order?.dbId || orderId;
      await apiAssignDelivery(dbId, personName);
      await refreshOrders();
    } catch (e) { console.error('Assign delivery error:', e); }
  };

  const cancelOrder = async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const dbId = order?.dbId || orderId;
      await apiCancelOrder(dbId);
      await Promise.all([refreshOrders(), refreshProducts()]);
    } catch (e) { console.error('Cancel order error:', e); }
  };

  const reorderItems = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    order.items.forEach(item => {
      const currentProduct = products.find(p => p.id === item.product.id);
      if (currentProduct && currentProduct.stock > 0) {
        addToCart(currentProduct, Math.min(item.quantity, currentProduct.stock));
      }
    });
  };

  // ── Products ──
  const updateProductStock = async (productId, newStock) => {
    try {
      await apiUpdateStock(productId, Math.max(0, newStock));
      await refreshProducts();
    } catch (e) { console.error('Update stock error:', e); }
  };

  const addProduct = async (product) => {
    try {
      await apiCreateProduct(product);
      await refreshProducts();
    } catch (e) { console.error('Add product error:', e); throw e; }
  };

  const updateProduct = async (productId, updates) => {
    try {
      await apiUpdateProduct(productId, updates);
      await refreshProducts();
    } catch (e) { console.error('Update product error:', e); throw e; }
  };

  const deleteProduct = async (productId) => {
    try {
      await apiDeleteProduct(productId);
      setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
      setWishlist(prev => prev.filter(id => id !== productId));
      await refreshProducts();
    } catch (e) { console.error('Delete product error:', e); throw e; }
  };

  // ── Wishlist ──
  const toggleWishlist = async (productId) => {
    // Optimistic update
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
    try {
      await apiToggleWishlist(productId);
    } catch (e) {
      // Revert on failure
      setWishlist(prev =>
        prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
      );
      console.error('Toggle wishlist error:', e);
    }
  };

  // ── Auth ──
  const login = async (email, password) => {
    try {
      const user = await apiLogin(email, password);
      setCurrentUser(user);
      return true;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    }
  };

  const logout = () => {
    apiLogout();
    setCurrentUser(null);
    setOrders([]);
    setUsers([]);
    setFeedback([]);
    setDeliveryStaff([]);
    setStaff([]);
    setWishlist([]);
    clearCart();
  };

  const register = async (name, email, phone, password) => {
    try {
      const user = await apiRegister(name, email, phone, password);
      setCurrentUser(user);
      return true;
    } catch (e) {
      console.error('Register error:', e);
      return false;
    }
  };

  // ── Feedback ──
  const submitFeedback = async (customerName, email, rating, message) => {
    try {
      await apiSubmitFeedback({ customerName, email, rating, message });
      if (currentUser?.role === 'admin') await refreshFeedback();
    } catch (e) { console.error('Submit feedback error:', e); }
  };

  const updateFeedbackStatus = async (feedbackId, status) => {
    try {
      await apiUpdateFeedbackStatus(feedbackId, status);
      await refreshFeedback();
    } catch (e) { console.error('Update feedback status error:', e); }
  };

  // ── Users (admin) ──
  const addUser = async (name, email, phone, role, password) => {
    try {
      await apiCreateUser({ name, email, phone, role, password });
      await refreshUsers();
    } catch (e) { console.error('Add user error:', e); throw e; }
  };

  const deleteUser = async (userId) => {
    try {
      await apiDeleteUser(userId);
      await refreshUsers();
    } catch (e) { console.error('Delete user error:', e); throw e; }
  };

  // ── Delivery Staff (admin) ──
  const updateDeliveryStaffStatus = async (staffId, status, currentOrderId) => {
    try {
      await apiUpdateDeliveryStaffStatus(staffId, status, currentOrderId);
      await refreshDeliveryStaff();
    } catch (e) { console.error('Update delivery staff error:', e); }
  };

  // ── Categories ──
  const addCategory = async (name, description) => {
    try {
      await apiCreateCategory(name, description);
      await refreshCategories();
    } catch (e) { console.error('Add category error:', e); throw e; }
  };

  const updateCategory = async (categoryId, updates) => {
    try {
      await apiUpdateCategory(categoryId, updates);
      await refreshCategories();
    } catch (e) { console.error('Update category error:', e); throw e; }
  };

  const deleteCategory = async (categoryId) => {
    try {
      await apiDeleteCategory(categoryId);
      await refreshCategories();
    } catch (e) { console.error('Delete category error:', e); throw e; }
  };

  // ── Staff Members ──
  const addStaffMember = async (staffData) => {
    try {
      await apiCreateStaff(staffData);
      await refreshStaff();
    } catch (e) { console.error('Add staff error:', e); throw e; }
  };

  const updateStaffMember = async (staffId, updates) => {
    try {
      await apiUpdateStaff(staffId, updates);
      await refreshStaff();
    } catch (e) { console.error('Update staff error:', e); throw e; }
  };

  const deleteStaffMember = async (staffId) => {
    try {
      await apiDeleteStaff(staffId);
      await refreshStaff();
    } catch (e) { console.error('Delete staff error:', e); throw e; }
  };

  // ── Computed helpers ──
  const getTotalRevenue = () => {
    return orders.filter(order => order.status === 'Delivered').reduce((sum, order) => sum + order.total, 0);
  };

  const getLowStockItems = () => {
    return products.filter(product => product.stock < 10);
  };

  const getExpiringItems = (daysAhead = 2) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + daysAhead);
    return products
      .filter(p => p.expiryDate)
      .map(p => ({ ...p, _expiry: new Date(p.expiryDate) }))
      .filter(p => !isNaN(p._expiry) && p._expiry <= cutoff)
      .map(p => {
        const diffMs = p._expiry.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return { ...p, daysLeft };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  };

  const getCustomerOrders = (email) => {
    return orders.filter(order => order.customerEmail === email);
  };

  const getDeliveryStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const active = orders.filter(o => o.status === 'Out for Delivery').length;
    const deliveredToday = orders.filter(o =>
      o.status === 'Delivered' && o.createdAt && o.createdAt.startsWith(today)
    ).length;
    const availableStaff = deliveryStaff.filter(s => s.status === 'Available').length;
    return { active, deliveredToday, availableStaff };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Bay Bakers...</p>
        </div>
      </div>
    );
  }

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        orders,
        users,
        feedback,
        deliveryStaff,
        categories,
        staff,
        wishlist,
        currentUser,
        isLoggedIn,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        placeOrder,
        placePOSSale,
        updateOrderStatus,
        assignDeliveryPerson,
        cancelOrder,
        reorderItems,
        updateProductStock,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        toggleWishlist,
        login,
        logout,
        register,
        submitFeedback,
        updateFeedbackStatus,
        addUser,
        deleteUser,
        updateDeliveryStaffStatus,
        getTotalRevenue,
        getLowStockItems,
        getExpiringItems,
        getCustomerOrders,
        getDeliveryStats,
        slides, refreshSlides, addSlide: apiAddSlide, deleteSlide: apiDeleteSlide,
        announcement, updateAnnouncement
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
};
