import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import { Input, Select } from './Input';
import { LoginModal } from './LoginModal';
import { OrderTrackingModal } from './OrderTrackingModal';
import { FeedbackModal } from './FeedbackModal';
import {
  ShoppingCart, X, Plus, Minus, Check, User, LogOut, Package,
  MessageSquare, Heart, Search, Star, RefreshCw, Ban,
  ChevronRight, MapPin, Truck, Sparkles, Clock, ShieldCheck,
  LayoutDashboard, CreditCard, Bike, Settings, ArrowUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CustomerPanel = () => {
  const {
    products, cart, addToCart, removeFromCart, updateCartQuantity,
    placeOrder, currentUser, isLoggedIn, logout, getCustomerOrders,
    wishlist, toggleWishlist, cancelOrder, reorderItems, categories,
    slides, announcement
  } = useStore();
  const navigate = useNavigate();

  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [detailQty, setDetailQty] = useState(1);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides]);

  const categoryNames = useMemo(() => ['All', ...categories.map(c => c.name)], [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch = !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const wishlistProducts = useMemo(
    () => products.filter(p => wishlist.includes(p.id)),
    [products, wishlist]
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const customerOrders = currentUser ? getCustomerOrders(currentUser.email) : [];
  const toast = useToast();

  const handlePlaceOrder = async () => {
    const name = isLoggedIn ? currentUser.name : customerName;
    const email = isLoggedIn ? currentUser.email : customerEmail;
    const phone = isLoggedIn ? currentUser.phone : customerPhone;

    if (!name || !deliveryAddress) {
      toast.warning('Please fill in all required fields');
      return;
    }
    if (!isLoggedIn && (!email || !phone)) {
      toast.warning('Please provide email and phone number');
      return;
    }

    try {
      await placeOrder(name, deliveryAddress, paymentMethod, email, phone);
      setShowCheckout(false);
      setShowCart(false);
      setOrderPlaced(true);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setTimeout(() => setOrderPlaced(false), 3500);
    } catch (e) {
      toast.error('Failed to place order. Please try again.');
    }
  };

  const handleAddFromDetail = () => {
    if (!detailProduct) return;
    addToCart(detailProduct, detailQty);
    setDetailProduct(null);
    setDetailQty(1);
  };

  const getStatusStyle = (status) => {
    const map = {
      Pending: 'bg-warning text-warning-foreground',
      Approved: 'bg-success text-success-foreground',
      'In Progress': 'bg-primary text-primary-foreground',
      'Out for Delivery': 'bg-secondary text-secondary-foreground',
      Delivered: 'bg-success text-success-foreground',
      Cancelled: 'bg-destructive text-destructive-foreground'
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      {/* Announcement Bar */}
      <AnimatePresence>
        {announcement?.is_active && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-primary text-primary-foreground py-2 px-4 relative overflow-hidden z-[40]"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
               <motion.p 
                 animate={{ x: [0, -20, 0] }}
                 transition={{ repeat: Infinity, duration: 4 }}
                 className="text-xs font-bold uppercase tracking-widest text-center"
               >
                 ✨ {announcement.message} ✨
               </motion.p>
            </div>
            <div className="absolute inset-0 bg-white/5 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center gap-4">
            <h1 className="text-xl font-semibold shrink-0 cursor-pointer" onClick={() => navigate('/')}>
              Bay Bakers
            </h1>

            {/* Search bar */}
            <div className="relative flex-1 max-w-md hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search breads, cakes, pastries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => setShowWishlist(true)}
                    className="relative p-2 rounded-full hover:bg-muted transition-colors group"
                  >
                    <Heart size={20} className={wishlist.length > 0 ? 'fill-destructive text-destructive' : 'text-muted-foreground group-hover:text-foreground'} />
                    {wishlist.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {wishlist.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setShowOrders(true)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Package size={20} />
                    <span className="hidden md:inline text-sm font-medium">Orders</span>
                  </button>

                  {/* Account Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                      className={`flex items-center gap-2 p-1.5 rounded-full transition-all ${
                        showAccountDropdown ? 'bg-primary/10 ring-2 ring-primary/20' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-inner">
                        {currentUser?.name[0]}
                      </div>
                    </button>

                    <AnimatePresence>
                      {showAccountDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowAccountDropdown(false)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                          >
                            <div className="p-5 border-b border-border bg-muted/30">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                  {currentUser?.name[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-foreground truncate">{currentUser?.name}</p>
                                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{currentUser?.role}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <MessageSquare size={12} />
                                  <span className="truncate">{currentUser?.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Truck size={12} />
                                  <span>{currentUser?.phone}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-2">
                              {/* Staff/Admin specific links */}
                              {currentUser?.role === 'admin' && (
                                <button
                                  onClick={() => { setShowAccountDropdown(false); navigate('/admin'); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl bg-primary/5 text-primary font-bold hover:bg-primary/10 transition-colors mb-1"
                                >
                                  <LayoutDashboard size={16} />
                                  Admin Dashboard
                                </button>
                              )}
                              
                              {(currentUser?.role === 'admin' || currentUser?.role === 'staff') && (
                                <button
                                  onClick={() => { setShowAccountDropdown(false); navigate('/pos'); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl bg-secondary/10 text-[#3B4D8C] font-bold hover:bg-secondary/20 transition-all mb-1 group"
                                >
                                  <CreditCard size={16} className="text-secondary" />
                                  POS System
                                </button>
                              )}

                              {(currentUser?.role === 'admin' || currentUser?.role === 'delivery') && (
                                <button
                                  onClick={() => { setShowAccountDropdown(false); navigate('/delivery'); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl bg-orange-500/10 text-orange-700 font-bold hover:bg-orange-500/20 transition-all mb-1 group"
                                >
                                  <Bike size={16} className="text-orange-600" />
                                  Delivery Panel
                                </button>
                              )}

                              {currentUser?.role !== 'admin' && currentUser?.role !== 'staff' && (
                                <div className="h-px bg-border my-2 mx-2" />
                              )}

                              <button
                                onClick={() => { setShowAccountDropdown(false); setShowOrders(true); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors"
                              >
                                <Package size={16} />
                                My Orders
                              </button>
                              <button
                                onClick={() => { setShowAccountDropdown(false); setShowWishlist(true); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors"
                              >
                                <Heart size={16} />
                                Wishlist
                              </button>
                              <button
                                onClick={() => { setShowAccountDropdown(false); setShowFeedback(true); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors"
                              >
                                <Star size={16} />
                                Give Feedback
                              </button>
                              
                              <div className="h-px bg-border my-2 mx-2" />
                              
                              <button
                                onClick={() => { logout(); setShowAccountDropdown(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <LogOut size={16} />
                                Sign Out
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <Button 
                  onClick={() => setShowLogin(true)} 
                  variant="outline" 
                  size="sm"
                  className="rounded-full px-6 border-primary/40 text-primary hover:bg-primary/5 hover:text-black hover:border-primary/60 font-bold transition-all"
                >
                  <User size={16} className="mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>

          {/* Mobile search */}
          <div className="mt-2 sm:hidden relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </nav>

      {/* Hero Slider */}
      <section className="relative h-[340px] sm:h-[450px] md:h-[600px] flex items-center justify-center overflow-hidden bg-zinc-950">
        <AnimatePresence initial={false}>
          {slides.length > 0 ? (
            <motion.div
              key={slides[currentSlide].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 z-0"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[8000ms] scale-105"
                style={{ 
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url(${slides[currentSlide].image_url})`
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 z-10">
                <motion.h1 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-3xl sm:text-5xl md:text-7xl font-black mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] uppercase tracking-tighter"
                >
                  {slides[currentSlide].title}
                </motion.h1>
                <motion.p 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-sm sm:text-lg md:text-2xl max-w-2xl opacity-90 font-bold mb-6 sm:mb-8 px-4 drop-shadow-lg italic"
                >
                  {slides[currentSlide].subtitle}
                </motion.p>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <Button
                    size="lg"
                    className="h-12 sm:h-16 px-8 sm:px-12 text-sm sm:text-lg rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:scale-105 transition-all duration-300 !bg-white !text-[#36457C] hover:!bg-white/95 border-none font-black uppercase tracking-tight"
                    onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Start Shopping
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&fit=crop&auto=format)' }}
            >
               <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
                  <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4">Bay Bakers</h1>
                  <p className="text-base sm:text-xl md:text-2xl opacity-90 mb-8 font-medium">Freshly Baked Every Day</p>
                  <Button size="lg" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>
                    Explore Menu
                  </Button>
               </div>
            </div>
          )}
        </AnimatePresence>

        {/* Slider Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-30">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentSlide === idx ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Subtle Bottom Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10 pointer-events-none" />
      </section>

      {/* Floating action buttons (cart + scroll-to-top) */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 10 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-card text-primary border border-border p-3 rounded-full shadow-lg hover:bg-muted transition-colors"
              aria-label="Scroll to top"
            >
              <ArrowUp size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowCart(true)}
          className="relative bg-primary text-primary-foreground p-3.5 rounded-full shadow-xl shadow-primary/30 hover:opacity-90 transition-opacity"
          aria-label="Open cart"
        >
          <ShoppingCart size={22} />
          {cartItemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* Product grid */}
      <div id="products" className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold">
            {searchQuery ? `Results for "${searchQuery}"` : 'Our Bakery Selection'}
          </h2>
          <span className="text-sm text-muted-foreground">{filteredProducts.length} items</span>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide no-scrollbar">
          {categoryNames.map((category, idx) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full text-sm transition-all whitespace-nowrap font-semibold shadow-sm ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground scale-105 shadow-primary/20'
                  : 'bg-card text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No products found for "{searchQuery}"</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all group flex flex-col relative"
                >
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                      onClick={() => { setDetailProduct(product); setDetailQty(1); }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all z-10"
                    >
                      <Heart
                        size={16}
                        className={wishlist.includes(product.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}
                      />
                    </button>
                    
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-destructive text-destructive-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">
                        {product.category}
                      </span>
                      {product.stock > 0 && product.stock < 10 && (
                        <span className="text-[10px] font-bold text-warning-foreground bg-warning/20 px-2 py-0.5 rounded uppercase">
                          Low Stock
                        </span>
                      )}
                    </div>
                    
                    <h3
                      className="text-sm sm:text-lg font-bold mb-1 cursor-pointer hover:text-primary transition-colors line-clamp-1"
                      onClick={() => { setDetailProduct(product); setDetailQty(1); }}
                    >
                      {product.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 flex-1 line-clamp-2 leading-relaxed italic">
                      {product.description}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 sm:pt-4 border-t border-border/50">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Price</span>
                        <span className="text-sm sm:text-xl text-foreground font-bold">Rs.{product.price.toFixed(2)}</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full sm:w-auto rounded-lg sm:rounded-xl px-2.5 sm:px-5 h-8 sm:h-10 text-xs sm:text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform shrink-0"
                        onClick={() => addToCart(product, 1)}
                        disabled={product.stock === 0}
                      >
                        <Plus size={14} className="mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* CART DRAWER */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-card w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-semibold">Shopping Cart</h2>
              <button onClick={() => setShowCart(false)} className="text-muted-foreground hover:text-foreground">
                <X size={22} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <ShoppingCart size={48} className="mb-4 text-muted-foreground/40" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowCart(false)}>
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-3 p-3 border border-border rounded-xl">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">Rs.{item.product.price.toFixed(2)} each</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 border border-border rounded-md flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 border border-border rounded-md flex items-center justify-center hover:bg-muted transition-colors"
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-auto text-destructive/70 hover:text-destructive transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-base">Subtotal</span>
                    <span className="text-xl text-primary font-semibold">Rs.{cartTotal.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => { setShowCart(false); setShowCheckout(true); }}
                  >
                    Proceed to Checkout
                    <ChevronRight size={18} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-semibold">Checkout</h2>
              <button onClick={() => setShowCheckout(false)} className="text-muted-foreground hover:text-foreground">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              {!isLoggedIn && (
                <>
                  <Input label="Your Name *" placeholder="Enter your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  <Input label="Email *" type="email" placeholder="Enter your email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                  <Input label="Phone Number *" type="tel" placeholder="Enter your phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </>
              )}

              {isLoggedIn && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">{currentUser?.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser?.email} · {currentUser?.phone}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Delivery Address *</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter full delivery address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Truck size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-primary">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay in cash when your order arrives.</p>
                  </div>
                  <Check size={18} className="text-primary shrink-0" />
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="border border-border rounded-lg p-3 mb-5">
              <p className="text-sm font-medium mb-2">Order Summary</p>
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between text-xs text-muted-foreground py-1">
                  <span>{item.product.name} × {item.quantity}</span>
                  <span>Rs.{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border mt-2 pt-2 flex justify-between font-semibold text-sm">
                <span>Total</span>
                <span className="text-primary">Rs.{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {!isLoggedIn && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                Have an account?{' '}
                <button onClick={() => { setShowCheckout(false); setShowLogin(true); }} className="text-primary hover:underline font-medium">
                  Login for faster checkout
                </button>
              </div>
            )}

            <Button className="w-full" size="lg" onClick={handlePlaceOrder}>
              <Truck size={18} className="mr-2" />
              Place Order
            </Button>
          </div>
        </div>
      )}

      {/* ORDERS MODAL */}
      {showOrders && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-semibold">My Orders</h2>
              <button onClick={() => setShowOrders(false)} className="text-muted-foreground hover:text-foreground">
                <X size={22} />
              </button>
            </div>

            {customerOrders.length === 0 ? (
              <div className="text-center py-16">
                <Package size={48} className="mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">No orders yet</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowOrders(false)}>
                  Start Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {customerOrders.map(order => (
                  <div key={order.id} className="border border-border rounded-xl p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{order.id}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusStyle(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-lg text-primary font-semibold">Rs.{order.total.toFixed(2)}</span>
                    </div>

                    <div className="text-xs text-muted-foreground mb-3">
                      {order.items.map((item, idx) => (
                        <span key={idx}>
                          {item.product.name} ×{item.quantity}{idx < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedOrder(order); setShowOrders(false); }}
                      >
                        Track Order
                      </Button>

                      {order.status === 'Delivered' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            reorderItems(order.id);
                            setShowOrders(false);
                          }}
                        >
                          <RefreshCw size={13} className="mr-1.5" />
                          Reorder
                        </Button>
                      )}

                      {(order.status === 'Pending' || order.status === 'Approved') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/5"
                          onClick={() => {
                            cancelOrder(order.id);
                            toast.success('Order cancelled');
                          }}
                        >
                          <Ban size={13} className="mr-1.5" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WISHLIST MODAL */}
      {showWishlist && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-card w-full max-w-sm h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Heart size={20} className="text-destructive fill-destructive" />
                Wishlist ({wishlistProducts.length})
              </h2>
              <button onClick={() => setShowWishlist(false)} className="text-muted-foreground hover:text-foreground">
                <X size={22} />
              </button>
            </div>

            {wishlistProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <Heart size={48} className="mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Your wishlist is empty</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowWishlist(false)}>
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {wishlistProducts.map(product => (
                  <div key={product.id} className="flex gap-3 p-3 border border-border rounded-xl">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                      <p className="text-primary font-semibold text-sm mt-1">Rs.{product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end justify-between">
                      <button onClick={() => toggleWishlist(product.id)} className="text-destructive/70 hover:text-destructive">
                        <X size={16} />
                      </button>
                      <Button
                        size="sm"
                        onClick={() => { addToCart(product, 1); setShowWishlist(false); }}
                        disabled={product.stock === 0}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {detailProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="relative h-64 shrink-0">
              <img
                src={detailProduct.image}
                alt={detailProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setDetailProduct(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white"
              >
                <X size={16} />
              </button>
              <button
                onClick={() => toggleWishlist(detailProduct.id)}
                className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white"
              >
                <Heart
                  size={15}
                  className={wishlist.includes(detailProduct.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}
                />
              </button>
              {detailProduct.stock === 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white/90 text-foreground font-semibold px-4 py-1.5 rounded-full">Out of Stock</span>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-start gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{detailProduct.category}</p>
                  <h2 className="text-lg sm:text-2xl font-semibold truncate">{detailProduct.name}</h2>
                </div>
                <span className="text-lg sm:text-2xl text-primary font-semibold whitespace-nowrap">Rs.{detailProduct.price.toFixed(2)}</span>
              </div>

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{detailProduct.description}</p>

              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                  detailProduct.stock === 0 ? 'bg-destructive/10 text-destructive' :
                  detailProduct.stock < 10 ? 'bg-warning/10 text-warning' :
                  'bg-success/10 text-success'
                }`}>
                  <Package size={14} />
                  {detailProduct.stock === 0 ? 'Out of stock' :
                   detailProduct.stock < 10 ? `Only ${detailProduct.stock} left` :
                   `${detailProduct.stock} in stock`}
                </div>
                {detailProduct.expiryDate && (
                  <span className="text-xs text-muted-foreground">
                    Best before: {detailProduct.expiryDate}
                  </span>
                )}
              </div>

              {detailProduct.stock > 0 && (
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="flex items-center border border-border rounded-lg shrink-0">
                    <button
                      onClick={() => setDetailQty(q => Math.max(1, q - 1))}
                      className="w-8 h-9 sm:w-9 sm:h-10 flex items-center justify-center rounded-l-lg hover:bg-muted"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-7 sm:w-8 text-center font-medium text-sm">{detailQty}</span>
                    <button
                      onClick={() => setDetailQty(q => Math.min(detailProduct.stock, q + 1))}
                      className="w-8 h-9 sm:w-9 sm:h-10 flex items-center justify-center rounded-r-lg hover:bg-muted"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <Button
                    className="flex-1 min-w-0 h-9 sm:h-10 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3"
                    onClick={handleAddFromDetail}
                  >
                    <ShoppingCart size={14} className="mr-1 shrink-0" />
                    <span className="truncate">Add · Rs.{(detailProduct.price * detailQty).toFixed(2)}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {selectedOrder && (
        <OrderTrackingModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Order placed toast */}
      {orderPlaced && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-success text-success-foreground px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 whitespace-nowrap">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Check size={14} />
          </div>
          <div>
            <p className="font-semibold text-sm">Order Placed Successfully!</p>
            <p className="text-xs opacity-90">We will deliver your order soon</p>
          </div>
        </div>
      )}
    </div>
  );
};
