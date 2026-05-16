import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { Receipt } from './Receipt';
import { 
  Printer, Trash2, DollarSign, Check, Search, 
  User, Phone, ShoppingCart, Tag, Percent, X,
  Plus, Minus, ChevronRight, QrCode, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';

export const POSPanel = () => {
  const { products, placePOSSale, categories } = useStore();
  const toast = useToast();
  const [currentOrder, setCurrentOrder] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState({ type: 'percentage', value: 0 });
  const [customer, setCustomer] = useState({ name: 'Walk-in Customer', phone: '' });
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cartOpen, setCartOpen] = useState(false);

  const categoryNames = ['All', ...categories.map(c => c.name)];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addToOrder = (product) => {
    setCurrentOrder(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (quantity <= 0) {
      setCurrentOrder(prev => prev.filter(item => item.product.id !== productId));
      return;
    }

    const finalQty = Math.min(quantity, product.stock);
    setCurrentOrder(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity: finalQty } : item
      )
    );
  };

  const subtotal = currentOrder.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  const discountAmount = useMemo(() => {
    if (discount.type === 'percentage') {
      return (subtotal * discount.value) / 100;
    }
    return Math.min(discount.value, subtotal);
  }, [subtotal, discount]);

  const orderTotal = subtotal - discountAmount;
  const totalItems = currentOrder.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async (method) => {
    setPaymentMethod(method);
    try {
      await placePOSSale({
        items: currentOrder,
        customerName: customer.name,
        customerPhone: customer.phone,
        paymentMethod: method
      });
      setShowReceipt(true);
    } catch (err) {
      toast.error(err.message || 'Could not complete sale');
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCurrentOrder([]);
      setDiscount({ type: 'percentage', value: 0 });
      setCustomer({ name: 'Walk-in Customer', phone: '' });
      setSearchQuery('');
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Products Side */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="p-4 sm:p-6 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bay Bakers POS</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">Efficient In-Store Ordering</p>
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder="Search products or categories..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 no-scrollbar">
            {categoryNames.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 scroll-smooth pb-24 lg:pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map(product => (
                <motion.button
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => addToOrder(product)}
                  disabled={product.stock === 0}
                  className={`group relative bg-card rounded-2xl p-3 border border-border hover:border-primary transition-all text-left flex flex-col h-full shadow-sm hover:shadow-xl ${
                    product.stock === 0 ? 'opacity-60 grayscale' : ''
                  }`}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.stock > 0 && product.stock < 10 && (
                      <div className="absolute top-2 right-2 bg-warning/90 backdrop-blur-md text-warning-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Low Stock
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-primary font-bold">Rs.{product.price.toFixed(2)}</span>
                    <span className="text-[10px] text-muted-foreground">Qty: {product.stock}</span>
                  </div>
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-background/40 flex items-center justify-center rounded-2xl backdrop-blur-[1px]">
                      <span className="bg-destructive text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Sold Out</span>
                    </div>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile cart toggle */}
      <button
        onClick={() => setCartOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-30 bg-primary text-primary-foreground rounded-full shadow-2xl shadow-primary/30 px-5 py-3 flex items-center gap-2 font-bold"
      >
        <ShoppingCart size={18} />
        <span>Order ({totalItems})</span>
        <span className="text-xs opacity-90">Rs.{orderTotal.toFixed(2)}</span>
      </button>

      {/* Mobile cart overlay */}
      {cartOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Cart Side */}
      <div className={`fixed lg:static inset-y-0 right-0 w-full max-w-[400px] lg:w-[400px] bg-card border-l border-border flex flex-col shrink-0 shadow-2xl z-50 transform transition-transform duration-300 ${cartOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
        <button
          onClick={() => setCartOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted z-10"
          aria-label="Close cart"
        >
          <X size={20} />
        </button>
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShoppingCart size={20} />
              </div>
              <h2 className="text-xl font-bold">Current Order</h2>
            </div>
            <button 
              onClick={() => setCurrentOrder([])}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
              title="Clear Order"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Customer Name" 
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-muted/50 focus:ring-1 focus:ring-primary outline-none"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              />
            </div>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Phone Number" 
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-muted/50 focus:ring-1 focus:ring-primary outline-none"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          {currentOrder.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/30">
                <ShoppingCart size={40} />
              </div>
              <p className="text-muted-foreground font-medium">Your cart is empty</p>
              <p className="text-xs text-muted-foreground mt-1">Start adding products by clicking on items from the menu</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {currentOrder.map(item => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-muted/30 rounded-xl p-3 border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 pr-2">
                        <h4 className="text-sm font-bold truncate">{item.product.name}</h4>
                        <p className="text-[10px] text-muted-foreground">Rs.{item.product.price.toFixed(2)} / unit</p>
                      </div>
                      <span className="text-sm font-bold text-primary">Rs.{(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-background rounded-lg border border-border p-0.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button 
                        onClick={() => updateQuantity(item.product.id, 0)}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-muted/20">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>Rs.{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1 text-xs text-primary font-bold">
                <Percent size={12} />
                <span>Discount</span>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="bg-transparent text-[10px] border border-border rounded px-1 outline-none"
                  value={discount.type}
                  onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
                >
                  <option value="percentage">%</option>
                  <option value="fixed">Rs.</option>
                </select>
                <input 
                  type="number" 
                  className="w-16 text-right text-sm font-bold bg-transparent border-b border-border outline-none focus:border-primary"
                  value={discount.value}
                  onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6 pt-2 border-t border-border/50">
            <span className="text-lg font-bold">Payable</span>
            <span className="text-2xl font-black text-primary">Rs.{orderTotal.toFixed(2)}</span>
          </div>

          <Button
            className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
            disabled={currentOrder.length === 0}
            onClick={() => handleCheckout('Cash')}
          >
            <DollarSign size={18} className="mr-2" />
            Charge Cash · Rs.{orderTotal.toFixed(2)}
          </Button>
        </div>
      </div>

      {showReceipt && (
        <Receipt
          items={currentOrder}
          total={orderTotal}
          subtotal={subtotal}
          discount={discountAmount}
          paymentMethod={paymentMethod}
          customerName={customer.name}
          customerPhone={customer.phone}
          onClose={handleCloseReceipt}
        />
      )}

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <Card className="max-w-xs w-full p-8 text-center rounded-[2rem] border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)]">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <Check size={40} className="text-success" />
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Order Success!</h3>
                <p className="text-muted-foreground text-sm">Receipt printed and inventory updated.</p>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
