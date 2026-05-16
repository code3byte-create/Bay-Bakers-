import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Input, Select } from './Input';
import { ProductFormModal } from './ProductFormModal';
import {
  LayoutDashboard, ShoppingBag, Package, Users, MessageSquare,
  DollarSign, AlertCircle, TrendingUp, Check, Clock, Truck,
  XCircle, Star, Plus, Trash2, Edit2, Bike, RefreshCw,
  MapPin, Phone, ShoppingBasket, Tag, UserCog, Grid, Settings, Menu, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { apiUploadImage } from '../services/api';
import { Image } from 'lucide-react';

const STATUS_COLOR = {
  Pending: 'bg-warning text-warning-foreground',
  Approved: 'bg-success text-success-foreground',
  'In Progress': 'bg-primary text-primary-foreground',
  'Out for Delivery': 'bg-secondary text-secondary-foreground',
  Delivered: 'bg-success text-success-foreground',
  Cancelled: 'bg-destructive text-destructive-foreground'
};

const StatusIcon = ({ status }) => {
  const map = {
    Pending: <Clock size={14} className="text-warning" />,
    Approved: <Check size={14} className="text-success" />,
    'In Progress': <TrendingUp size={14} className="text-primary" />,
    'Out for Delivery': <Truck size={14} className="text-secondary" />,
    Delivered: <Truck size={14} className="text-success" />,
    Cancelled: <XCircle size={14} className="text-destructive" />
  };
  return map[status] || null;
};

export const AdminPanel = () => {
  const {
    orders, products, users, feedback, deliveryStaff, categories, staff,
    updateOrderStatus, assignDeliveryPerson, updateProductStock,
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory,
    addStaffMember, updateStaffMember, deleteStaffMember,
    getTotalRevenue, getLowStockItems, getExpiringItems, getDeliveryStats,
    updateFeedbackStatus, addUser, deleteUser, updateDeliveryStaffStatus,
    slides, refreshSlides, addSlide, deleteSlide,
    announcement, updateAnnouncement
  } = useStore();

  const [activeView, setActiveView] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryPersonName, setDeliveryPersonName] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [productModal, setProductModal] = useState({ open: false });
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', role: 'customer', password: '' });
  const [productFilter, setProductFilter] = useState('All');
  const [orderFilter, setOrderFilter] = useState('All');
  const [newSlide, setNewSlide] = useState({ image_url: '', title: '', subtitle: '', priority: 0 });
  const [uploadingSlide, setUploadingSlide] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ message: '', is_active: 1 });

  // Sync announcement form when data loads
  React.useEffect(() => {
    if (announcement) {
      setAnnouncementForm(announcement);
    }
  }, [announcement]);

  // One-time expiry warning toast per session (when products load)
  const expiryToastShownRef = React.useRef(false);
  React.useEffect(() => {
    if (expiryToastShownRef.current) return;
    if (products.length === 0) return;
    const expiring = getExpiringItems(2);
    if (expiring.length > 0) {
      expiryToastShownRef.current = true;
      toast.warning(`${expiring.length} product(s) expire within 2 days. Check Dashboard.`);
    }
  }, [products]);

  const totalRevenue = getTotalRevenue();
  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
  const lowStockItems = getLowStockItems();
  const expiringItems = getExpiringItems(2);
  const newFeedbackCount = feedback.filter(f => f.status === 'New').length;
  const deliveryStats = getDeliveryStats();
  const totalCustomers = users.filter(u => u.role === 'customer').length;

  const salesData = [
    { day: 'Mon', revenue: 580 },
    { day: 'Tue', revenue: 720 },
    { day: 'Wed', revenue: 650 },
    { day: 'Thu', revenue: 890 },
    { day: 'Fri', revenue: 950 },
    { day: 'Sat', revenue: 1200 },
    { day: 'Sun', revenue: 1100 }
  ];

  const statusData = [
    { name: 'Pending', value: orders.filter(o => o.status === 'Pending').length },
    { name: 'In Progress', value: orders.filter(o => o.status === 'In Progress').length },
    { name: 'Out for Delivery', value: orders.filter(o => o.status === 'Out for Delivery').length },
    { name: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length }
  ].filter(d => d.value > 0);

  const PIE_COLORS = ['#EAB308', '#36457C', '#5B6EAE', '#16A34A'];

  const filteredOrders = orders.filter(order => {
    const matchSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = orderFilter === 'All' || order.status === orderFilter;
    return matchSearch && matchStatus;
  });

  const filteredProducts = products.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = productFilter === 'All' || product.category === productFilter;
    return matchSearch && matchCat;
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFeedback = feedback.filter(fb =>
    fb.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fb.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeDeliveries = orders.filter(o => o.status === 'Out for Delivery');

  const toast = useToast();

  const handleAssignDelivery = async (orderId) => {
    if (!deliveryPersonName.trim()) {
      toast.warning('Please enter delivery person name');
      return;
    }
    await assignDeliveryPerson(orderId, deliveryPersonName);
    const staffMember = deliveryStaff.find(s => s.name === deliveryPersonName);
    if (staffMember) await updateDeliveryStaffStatus(staffMember.id, 'Busy', orderId);
    setSelectedOrder(null);
    setDeliveryPersonName('');
  };

  const handleMarkDelivered = async (orderId) => {
    await updateOrderStatus(orderId, 'Delivered', 'Order delivered successfully');
    const order = orders.find(o => o.id === orderId);
    if (order?.deliveryPerson) {
      const staffMember = deliveryStaff.find(s => s.name === order.deliveryPerson);
      if (staffMember) {
        await updateDeliveryStaffStatus(staffMember.id, 'Available');
      }
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.phone || !newUser.password) {
      toast.warning('Please fill all fields');
      return;
    }
    try {
      await addUser(newUser.name, newUser.email, newUser.phone, newUser.role, newUser.password);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', phone: '', role: 'customer', password: '' });
      toast.success('User added successfully');
    } catch (e) {
      toast.error('Failed to add user. Email may already exist.');
    }
  };

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: '', email: '', phone: '', role: 'Baker',
    status: 'Active', joined_date: '', salary: '', password: ''
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'slider', label: 'Slider', icon: Image },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: activeOrders },
    { id: 'products', label: 'Products', icon: Package, badge: lowStockItems.length },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'staff', label: 'Staff', icon: UserCog },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, badge: newFeedbackCount },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-60 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 z-50 transform transition-transform duration-300 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Bay Bakers</h1>
            <p className="text-xs text-muted-foreground mt-1">Admin Dashboard</p>
          </div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="px-3 py-4 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); setSearchTerm(''); setMobileNavOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 mb-1 rounded-lg transition-colors relative text-sm ${
                activeView === item.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-destructive text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Bay Bakers Admin</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted text-foreground"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-base font-semibold">Bay Bakers Admin</h1>
          <div className="w-9" />
        </div>

        <div className="p-4 sm:p-6 lg:p-8">

          {/* DASHBOARD */}
          {activeView === 'dashboard' && (
            <>
              <h2 className="text-3xl mb-6">Dashboard Overview</h2>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Revenue', value: `Rs.${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'bg-primary/10 text-primary' },
                  { label: 'Active Orders', value: activeOrders, icon: ShoppingBag, color: 'bg-success/10 text-success' },
                  { label: 'Customers', value: totalCustomers, icon: Users, color: 'bg-secondary/10 text-secondary' },
                  { label: 'Low Stock', value: lowStockItems.length, icon: AlertCircle, color: 'bg-destructive/10 text-destructive' }
                ].map(card => (
                  <Card key={card.label}>
                    <CardContent className="flex items-center gap-3 py-4">
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${card.color}`}>
                        <card.icon size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className="text-xl font-semibold">{card.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader><CardTitle>Weekly Sales</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(54,69,124,0.1)" />
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="#36457C" radius={[6, 6, 0, 0]} key="revenue-bar" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader><CardTitle>Orders by Status</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          nameKey="name"
                        >
                          {statusData.map((entry, idx) => (
                            <Cell key={`cell-${entry.name}-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Delivery snapshot */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bike size={18} className="text-primary" />
                      Active Deliveries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeDeliveries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No active deliveries right now.</p>
                    ) : (
                      <div className="space-y-3">
                        {activeDeliveries.slice(0, 3).map(order => (
                          <div key={order.id} className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                              <Truck size={14} className="text-secondary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{order.customerName}</p>
                              <p className="text-xs text-muted-foreground truncate">{order.deliveryAddress}</p>
                              {order.deliveryPerson && (
                                <p className="text-xs text-primary mt-0.5">Rider: {order.deliveryPerson}</p>
                              )}
                            </div>
                            {order.eta && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
                                {order.eta}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {lowStockItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertCircle size={18} />
                        Low Stock Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {lowStockItems.slice(0, 5).map(item => (
                          <div key={item.id} className="flex justify-between items-center p-2.5 bg-destructive/5 rounded-lg border border-destructive/15">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                            <span className="text-destructive font-semibold text-sm">{item.stock} left</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Expiry Alerts */}
              {expiringItems.length > 0 && (
                <Card className="mb-6 border-warning/40 bg-warning/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-warning-foreground">
                      <Clock size={18} className="text-warning" />
                      Expiry Alerts
                      <span className="ml-2 bg-warning text-warning-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                        {expiringItems.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      The following products expire within the next 2 days. Consider applying discounts or removing from sale.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {expiringItems.map(item => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 bg-card border border-warning/30 rounded-lg"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.category} · Exp: {item.expiryDate}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 ml-2 text-xs font-bold px-2.5 py-1 rounded-full ${
                              item.daysLeft <= 0
                                ? 'bg-destructive text-destructive-foreground'
                                : 'bg-warning text-warning-foreground'
                            }`}
                          >
                            {item.daysLeft <= 0
                              ? 'Expired'
                              : item.daysLeft === 1
                              ? '1 day'
                              : `${item.daysLeft} days`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ORDERS */}
          {activeView === 'orders' && (
            <>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-3xl">Order Management</h2>
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-input-background text-sm"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-4">Order ID</th>
                          <th className="text-left p-4">Customer</th>
                          <th className="text-left p-4">Items</th>
                          <th className="text-left p-4">Total</th>
                          <th className="text-left p-4">Status</th>
                          <th className="text-left p-4">Payment</th>
                          <th className="text-left p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(order => (
                          <tr key={order.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                            <td className="p-4 font-medium">{order.id}</td>
                            <td className="p-4">
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-xs text-muted-foreground">{order.deliveryAddress}</p>
                              <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-xs text-muted-foreground">
                                {order.items.map(i => `${i.product.name} ×${i.quantity}`).join(', ')}
                              </p>
                            </td>
                            <td className="p-4 text-primary font-semibold">Rs.{order.total.toFixed(2)}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[order.status]}`}>
                                <StatusIcon status={order.status} />
                                {order.status}
                              </span>
                              {order.deliveryPerson && (
                                <p className="text-xs text-muted-foreground mt-1">🏍 {order.deliveryPerson}</p>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="text-xs bg-muted px-2 py-1 rounded">{order.paymentMethod}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1.5">
                                <select
                                  value={order.status}
                                  onChange={async (e) => {
                                    const ns = e.target.value;
                                    const msgs = {
                                      Pending: 'Status set to Pending',
                                      Approved: 'Order approved for preparation',
                                      'In Progress': 'Order is being prepared',
                                      'Out for Delivery': 'Order out for delivery',
                                      Delivered: 'Order delivered successfully',
                                      Cancelled: 'Order cancelled'
                                    };
                                    if (ns === 'Delivered') {
                                      await handleMarkDelivered(order.id);
                                    } else {
                                      await updateOrderStatus(order.id, ns, msgs[ns]);
                                    }
                                    toast.success(msgs[ns]);
                                  }}
                                  className="px-2 py-1 border border-border rounded-lg bg-input-background text-xs"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Approved">Approved</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Out for Delivery">Out for Delivery</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                                {order.status === 'In Progress' && !order.deliveryPerson && (
                                  <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                                    Assign Rider
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredOrders.length === 0 && (
                      <p className="text-center py-12 text-muted-foreground">No orders found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <Card className="w-full max-w-md p-6">
                    <h3 className="text-xl mb-1">Assign Delivery Rider</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedOrder.id} — {selectedOrder.customerName}
                    </p>
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Available Staff</p>
                      <div className="space-y-2">
                        {deliveryStaff.filter(s => s.status === 'Available').map(staffMember => (
                          <button
                            key={staffMember.id}
                            onClick={() => setDeliveryPersonName(staffMember.name)}
                            className={`w-full text-left flex items-center justify-between p-3 rounded-lg border transition-colors ${
                              deliveryPersonName === staffMember.name
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            <div>
                              <p className="font-medium text-sm">{staffMember.name}</p>
                              <p className="text-xs text-muted-foreground">{staffMember.phone}</p>
                            </div>
                            <span className="text-xs text-success font-medium">{staffMember.ordersDelivered} delivered</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-3">
                        <Input
                          label="Or type a name"
                          placeholder="Delivery person name"
                          value={deliveryPersonName}
                          onChange={(e) => setDeliveryPersonName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => { setSelectedOrder(null); setDeliveryPersonName(''); }}>
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={() => handleAssignDelivery(selectedOrder.id)}>
                        Assign
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* PRODUCTS */}
          {activeView === 'products' && (
            <>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-3xl">Product Management</h2>
                <div className="flex gap-3 flex-wrap items-center">
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button onClick={() => setProductModal({ open: true })}>
                    <Plus size={16} className="mr-2" />
                    Add Product
                  </Button>
                </div>
              </div>

              {/* Category filter */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {['All', ...categories.map(c => c.name)].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setProductFilter(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap ${
                      productFilter === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-4 w-16">Image</th>
                          <th className="text-left p-4">Product</th>
                          <th className="text-left p-4">Category</th>
                          <th className="text-left p-4">Price</th>
                          <th className="text-left p-4">Stock</th>
                          <th className="text-left p-4">Expiry</th>
                          <th className="text-left p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(product => (
                          <tr
                            key={product.id}
                            className={`border-b border-border last:border-b-0 hover:bg-muted/30 ${
                              product.stock < 10 ? 'bg-destructive/3' : ''
                            }`}
                          >
                            <td className="p-4">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{product.description}</p>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full text-xs bg-accent/40 text-accent-foreground">
                                {product.category}
                              </span>
                            </td>
                            <td className="p-4 text-primary font-semibold">Rs.{product.price.toFixed(2)}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={product.stock}
                                  onChange={(e) => updateProductStock(product.id, parseInt(e.target.value) || 0)}
                                  className={`w-16 px-2 py-1 border rounded text-sm text-center ${
                                    product.stock < 10
                                      ? 'border-destructive text-destructive bg-destructive/5'
                                      : 'border-border bg-input-background'
                                  }`}
                                  min="0"
                                />
                                {product.stock < 10 && (
                                  <AlertCircle size={14} className="text-destructive" />
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {product.expiryDate || '—'}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setProductModal({ open: true, product })}
                                >
                                  <Edit2 size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteProduct(product.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                      <p className="text-center py-12 text-muted-foreground">No products found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {productModal.open && (
                <ProductFormModal
                  product={productModal.product}
                  onSave={async (data) => {
                    try {
                      if (productModal.product) {
                        await updateProduct(productModal.product.id, data);
                        toast.success('Product updated');
                      } else {
                        await addProduct(data);
                        toast.success('Product added');
                      }
                      setProductModal({ open: false });
                    } catch (e) {
                      toast.error('Failed to save product');
                    }
                  }}
                  onClose={() => setProductModal({ open: false })}
                />
              )}
            </>
          )}

          {/* DELIVERY */}
          {activeView === 'delivery' && (
            <>
              <h2 className="text-3xl mb-6">Delivery Management</h2>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Active Deliveries', value: deliveryStats.active, icon: Truck, color: 'bg-secondary/10 text-secondary' },
                  { label: 'Delivered Today', value: deliveryStats.deliveredToday, icon: Check, color: 'bg-success/10 text-success' },
                  { label: 'Staff Available', value: deliveryStats.availableStaff, icon: Bike, color: 'bg-primary/10 text-primary' }
                ].map(card => (
                  <Card key={card.label}>
                    <CardContent className="flex items-center gap-3 py-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.color}`}>
                        <card.icon size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className="text-xl font-semibold">{card.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Active deliveries */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck size={18} className="text-secondary" />
                    Out for Delivery ({activeDeliveries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeDeliveries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No orders currently out for delivery.</p>
                  ) : (
                    <div className="space-y-4">
                      {activeDeliveries.map(order => (
                        <div key={order.id} className="border border-border rounded-xl p-4 bg-card">
                          <div className="flex flex-wrap justify-between gap-4 mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{order.id}</span>
                                <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                                  Out for Delivery
                                </span>
                                {order.eta && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    ETA: {order.eta}
                                  </span>
                                )}
                              </div>
                              <p className="font-medium">{order.customerName}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin size={11} />
                                {order.deliveryAddress}
                              </div>
                              {order.customerPhone && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                  <Phone size={11} />
                                  {order.customerPhone}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xl text-primary font-semibold">${order.total.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                            <ShoppingBasket size={12} />
                            {order.items.map(i => `${i.product.name} ×${i.quantity}`).join(', ')}
                          </div>

                          {order.deliveryPerson ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                                  <Bike size={14} className="text-secondary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{order.deliveryPerson}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {deliveryStaff.find(s => s.name === order.deliveryPerson)?.phone || ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                                  <RefreshCw size={13} className="mr-1" />
                                  Reassign
                                </Button>
                                <Button size="sm" onClick={() => handleMarkDelivered(order.id)}>
                                  <Check size={13} className="mr-1" />
                                  Mark Delivered
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => setSelectedOrder(order)}>
                              <Bike size={13} className="mr-1" />
                              Assign Rider
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Orders needing assignment */}
              {orders.filter(o => o.status === 'In Progress' && !o.deliveryPerson).length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-warning flex items-center gap-2">
                      <Clock size={18} />
                      Ready for Dispatch
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'In Progress' && !o.deliveryPerson).map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{order.id} — {order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.deliveryAddress}</p>
                          </div>
                          <Button size="sm" onClick={() => setSelectedOrder(order)}>
                            Assign Rider
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Delivery Staff Roster */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users size={18} />
                    Delivery Staff Roster
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {deliveryStaff.map(staffMember => (
                      <div key={staffMember.id} className="flex items-center justify-between p-4 border border-border rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                            staffMember.status === 'Available' ? 'bg-success' :
                            staffMember.status === 'Busy' ? 'bg-secondary' : 'bg-muted-foreground'
                          }`}>
                            {staffMember.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{staffMember.name}</p>
                            <p className="text-xs text-muted-foreground">{staffMember.phone}</p>
                            <p className="text-xs text-muted-foreground">{staffMember.ordersDelivered} deliveries total</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            staffMember.status === 'Available' ? 'bg-success/15 text-success' :
                            staffMember.status === 'Busy' ? 'bg-secondary/15 text-secondary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {staffMember.status}
                          </span>
                          {staffMember.currentOrderId && (
                            <p className="text-xs text-muted-foreground mt-1">{staffMember.currentOrderId}</p>
                          )}
                          <select
                            value={staffMember.status}
                            onChange={(e) => updateDeliveryStaffStatus(staffMember.id, e.target.value)}
                            className="mt-2 px-2 py-1 border border-border rounded text-xs bg-input-background"
                          >
                            <option value="Available">Available</option>
                            <option value="Busy">Busy</option>
                            <option value="Off Duty">Off Duty</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <Card className="w-full max-w-md p-6">
                    <h3 className="text-xl mb-1">Assign Delivery Rider</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedOrder.id} — {selectedOrder.customerName}
                    </p>
                    <div className="space-y-2 mb-4">
                      {deliveryStaff.filter(s => s.status === 'Available').map(staffMember => (
                        <button
                          key={staffMember.id}
                          onClick={() => setDeliveryPersonName(staffMember.name)}
                          className={`w-full text-left flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            deliveryPersonName === staffMember.name ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-sm">{staffMember.name}</p>
                            <p className="text-xs text-muted-foreground">{staffMember.phone}</p>
                          </div>
                          <span className="text-xs text-success">{staffMember.ordersDelivered} delivered</span>
                        </button>
                      ))}
                      {deliveryStaff.filter(s => s.status === 'Available').length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-3">No staff currently available.</p>
                      )}
                    </div>
                    <Input
                      label="Or enter name manually"
                      placeholder="Delivery person name"
                      value={deliveryPersonName}
                      onChange={(e) => setDeliveryPersonName(e.target.value)}
                    />
                    <div className="flex gap-3 mt-4">
                      <Button variant="outline" className="flex-1" onClick={() => { setSelectedOrder(null); setDeliveryPersonName(''); }}>
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={() => handleAssignDelivery(selectedOrder.id)}>
                        Assign
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* USERS */}
          {activeView === 'users' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl">User Management</h2>
                <div className="flex gap-3">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button onClick={() => setShowAddUser(true)}>
                    <Plus size={16} className="mr-2" />
                    Add User
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-4">Name</th>
                          <th className="text-left p-4">Email</th>
                          <th className="text-left p-4">Phone</th>
                          <th className="text-left p-4">Role</th>
                          <th className="text-left p-4">Joined</th>
                          <th className="text-left p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                                  {user.name[0]}
                                </div>
                                <span className="font-medium">{user.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground">{user.email}</td>
                            <td className="p-4 text-muted-foreground">{user.phone}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                user.role === 'admin' ? 'bg-primary text-primary-foreground' :
                                user.role === 'staff' ? 'bg-secondary text-secondary-foreground' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td className="p-4">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUser(user.id)}
                                disabled={user.role === 'admin'}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {showAddUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <Card className="w-full max-w-md p-6">
                    <h3 className="text-xl mb-4">Add New User</h3>
                    <div className="space-y-4">
                      <Input label="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                      <Input label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                      <Input label="Phone" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
                      <Select label="Role" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                        <option value="customer">Customer</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </Select>
                      <Input label="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button variant="outline" className="flex-1" onClick={() => setShowAddUser(false)}>Cancel</Button>
                      <Button className="flex-1" onClick={handleAddUser}>Add User</Button>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* CATEGORIES */}
          {activeView === 'categories' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl">Category Management</h2>
                <Button onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ name: '', description: '' });
                  setShowCategoryModal(true);
                }}>
                  <Plus size={16} className="mr-1" /> Add Category
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.map(cat => {
                  const productCount = products.filter(p => p.category === cat.name).length;
                  return (
                    <Card key={cat.id} className="relative group">
                      <CardContent className="pt-4 pb-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Tag size={24} className="text-primary" />
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setCategoryForm({ name: cat.name, description: cat.description });
                                setShowCategoryModal(true);
                              }}
                              className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => {
                                if (productCount > 0) {
                                  toast.warning(`Cannot delete category with ${productCount} products.`);
                                  return;
                                }
                                deleteCategory(cat.id);
                              }}
                              className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{cat.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{cat.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                            {productCount} Products
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <Card className="w-full max-w-md p-6">
                    <h3 className="text-xl mb-4">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
                    <div className="space-y-4">
                      <Input
                        label="Category Name"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        placeholder="e.g. Breads"
                      />
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Description</label>
                        <textarea
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          rows={3}
                          placeholder="Brief description..."
                          className="w-full px-3 py-2 border border-border rounded-xl bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button variant="outline" className="flex-1" onClick={() => setShowCategoryModal(false)}>
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={() => {
                        if (!categoryForm.name || !categoryForm.description) {
                          toast.warning('Please fill all fields.');
                          return;
                        }
                        if (editingCategory) {
                          updateCategory(editingCategory.id, { 
                            name: categoryForm.name, 
                            description: categoryForm.description 
                          });
                        } else {
                          addCategory(categoryForm.name, categoryForm.description);
                        }
                        setShowCategoryModal(false);
                      }}>
                        {editingCategory ? 'Save Changes' : 'Add Category'}
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* STAFF */}
          {activeView === 'staff' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl">Staff Management</h2>
                <Button onClick={() => {
                  setEditingStaff(null);
                  setStaffForm({
                    name: '', email: '', phone: '', role: 'Baker',
                    status: 'Active', joined_date: new Date().toISOString().split('T')[0], salary: '', password: ''
                  });
                  setShowStaffModal(true);
                }}>
                  <Plus size={16} className="mr-1" /> Add Staff
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                {['Baker', 'Cashier', 'Manager', 'Delivery'].map(role => {
                  const count = staff.filter(s => s.role === role && s.status === 'Active').length;
                  const icons = { Baker: ShoppingBasket, Cashier: DollarSign, Manager: UserCog, Delivery: Bike };
                  const Icon = icons[role];
                  return (
                    <Card key={role}>
                      <CardContent className="py-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <Icon size={18} className="text-primary" />
                        </div>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground mt-1">{role}s</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted text-sm">
                        <tr>
                          {['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Salary', 'Actions'].map(h => (
                            <th key={h} className="text-left p-4 font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {staff.map(member => (
                          <tr key={member.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                                  {member.name[0]}
                                </div>
                                <span className="font-medium">{member.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">{member.email}</td>
                            <td className="p-4 text-sm text-muted-foreground">{member.phone}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {member.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                member.status === 'Active' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                              }`}>
                                {member.status}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">{new Date(member.joinedDate).toLocaleDateString()}</td>
                            <td className="p-4 text-sm font-semibold text-primary">${member.salary}</td>
                            <td className="p-4">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingStaff(member);
                                    setStaffForm({
                                      name: member.name,
                                      email: member.email,
                                      phone: member.phone,
                                      role: member.role,
                                      status: member.status,
                                      joined_date: member.joinedDate,
                                      salary: String(member.salary || ''),
                                      password: ''
                                    });
                                    setShowStaffModal(true);
                                  }}
                                  className="p-1.5 rounded hover:bg-muted"
                                  title="Edit"
                                >
                                  <Edit2 size={14} className="text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() => deleteStaffMember(member.id)}
                                  className="p-1.5 rounded hover:bg-destructive/10"
                                  title="Delete"
                                >
                                  <Trash2 size={14} className="text-destructive" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {showStaffModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xl mb-4">{editingStaff ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                    <div className="space-y-4">
                      <Input
                        label="Full Name"
                        value={staffForm.name}
                        onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                        placeholder="e.g. John Doe"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Email"
                          type="email"
                          value={staffForm.email}
                          onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                          placeholder="john@baybakers.com"
                        />
                        <Input
                          label="Phone"
                          value={staffForm.phone}
                          onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                          placeholder="+1234567890"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Role"
                          value={staffForm.role}
                          onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                        >
                          <option value="Baker">Baker</option>
                          <option value="Cashier">Cashier</option>
                          <option value="Manager">Manager</option>
                          <option value="Delivery">Delivery</option>
                        </Select>
                        <Select
                          label="Status"
                          value={staffForm.status}
                          onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Join Date"
                          type="date"
                          value={staffForm.joined_date || ''}
                          onChange={(e) => setStaffForm({ ...staffForm, joined_date: e.target.value })}
                        />
                        <Input
                          label="Salary (Rs.)"
                          type="number"
                          min="0"
                          value={staffForm.salary}
                          onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                          placeholder="e.g. 35000"
                        />
                      </div>
                      <Input
                        label="Password"
                        type="password"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        placeholder={editingStaff ? "Leave blank to keep current" : "Set initial password"}
                      />
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button variant="outline" className="flex-1" onClick={() => setShowStaffModal(false)}>
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={() => {
                        if (!staffForm.name || !staffForm.email || !staffForm.phone || !staffForm.joined_date) {
                          toast.warning('Please fill all required fields.');
                          return;
                        }
                        const data = {
                          ...staffForm,
                          salary: parseFloat(staffForm.salary) || 0
                        };
                        
                        if (editingStaff) {
                          updateStaffMember(editingStaff.id, data);
                        } else {
                          addStaffMember(data);
                        }
                        setShowStaffModal(false);
                      }}>
                        {editingStaff ? 'Save Changes' : 'Add Staff'}
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* SLIDER MANAGEMENT */}
          {activeView === 'slider' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Hero Slider Management</h2>
                <Button 
                  onClick={() => {
                    const form = document.getElementById('add-slide-form');
                    form.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="rounded-xl shadow-lg shadow-primary/20"
                >
                  <Plus size={18} className="mr-2" />
                  New Slide
                </Button>
              </div>

              {/* Current Slides List */}
              <Card className="mb-8 overflow-hidden rounded-2xl border-none shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider">Preview</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider">Content</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-center">Priority</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {slides.map(slide => (
                        <tr key={slide.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <img src={slide.image_url} className="w-32 h-16 object-cover rounded-lg shadow-sm" alt="" />
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-sm">{slide.title || 'Untitled'}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{slide.subtitle}</p>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                              {slide.priority}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => deleteSlide(slide.id)}
                              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {slides.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-12 text-center text-muted-foreground italic">
                            No slides added yet. Use the form below to add your first slide.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Add New Slide Form */}
              <div id="add-slide-form">
                <Card className="max-w-3xl mx-auto rounded-3xl border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-primary text-primary-foreground p-6">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Plus size={24} />
                      Add New Hero Slide
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Slide Title"
                          placeholder="e.g. Fresh Artisan Breads"
                          value={newSlide.title}
                          onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                        />
                        <Input
                          label="Priority (Higher = First)"
                          type="number"
                          value={newSlide.priority}
                          onChange={(e) => setNewSlide({ ...newSlide, priority: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      
                      <Input
                        label="Subtitle"
                        placeholder="e.g. Experience the true taste of artisan craftsmanship..."
                        value={newSlide.subtitle}
                        onChange={(e) => setNewSlide({ ...newSlide, subtitle: e.target.value })}
                      />

                      <div>
                        <label className="block text-sm font-bold mb-2">Slide Image</label>
                        <div className="flex gap-3">
                          <Input
                            placeholder="Image URL or Upload -->"
                            className="flex-1"
                            value={newSlide.image_url}
                            onChange={(e) => setNewSlide({ ...newSlide, image_url: e.target.value })}
                          />
                          <input
                            type="file"
                            id="slide-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                setUploadingSlide(true);
                                const url = await apiUploadImage(file);
                                setNewSlide({ ...newSlide, image_url: url });
                                toast.success('Slide image uploaded');
                              } catch (err) {
                                toast.error(err.message);
                              } finally {
                                setUploadingSlide(false);
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            disabled={uploadingSlide}
                            onClick={() => document.getElementById('slide-upload').click()}
                          >
                            {uploadingSlide ? '...' : 'Upload'}
                          </Button>
                        </div>
                      </div>

                      {newSlide.image_url && (
                        <div className="rounded-xl overflow-hidden border border-border">
                          <img src={newSlide.image_url} className="w-full h-48 object-cover" alt="Preview" />
                        </div>
                      )}

                      <Button 
                        size="lg" 
                        className="w-full h-14 rounded-2xl text-lg shadow-xl shadow-primary/20 mt-4"
                        onClick={async () => {
                          if (!newSlide.image_url) {
                            toast.warning('Please provide a slide image');
                            return;
                          }
                          await addSlide(newSlide);
                          setNewSlide({ image_url: '', title: '', subtitle: '', priority: 0 });
                          toast.success('New slide added to hero section!');
                        }}
                      >
                        Publish Slide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* FEEDBACK */}
          {activeView === 'feedback' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl">Customer Feedback</h2>
                <Input
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Total Reviews', value: feedback.length, color: 'text-foreground' },
                  { label: 'New', value: feedback.filter(f => f.status === 'New').length, color: 'text-primary' },
                  { label: 'Avg Rating', value: (feedback.reduce((s, f) => s + f.rating, 0) / (feedback.length || 1)).toFixed(1) + ' ★', color: 'text-warning' }
                ].map(s => (
                  <Card key={s.label}>
                    <CardContent className="py-4 text-center">
                      <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4">
                {filteredFeedback.map(fb => (
                  <Card key={fb.id}>
                    <CardContent>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                            {fb.customerName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{fb.customerName}</p>
                            <p className="text-xs text-muted-foreground">{fb.email}</p>
                            <p className="text-xs text-muted-foreground">{new Date(fb.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                size={14}
                                className={star <= fb.rating ? 'text-warning fill-warning' : 'text-border'}
                              />
                            ))}
                          </div>
                          <select
                            value={fb.status}
                            onChange={(e) => updateFeedbackStatus(fb.id, e.target.value)}
                            className={`px-2.5 py-1 border border-border rounded-lg bg-input-background text-xs ${
                              fb.status === 'New' ? 'text-primary font-semibold' : ''
                            }`}
                          >
                            <option value="New">New</option>
                            <option value="Read">Read</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{fb.message}</p>
                    </CardContent>
                  </Card>
                ))}
                {filteredFeedback.length === 0 && (
                  <p className="text-center py-12 text-muted-foreground">No feedback found.</p>
                )}
              </div>
            </>
          )}
          {/* SETTINGS */}
          {activeView === 'settings' && (
            <div className="max-w-2xl mx-auto animate-in">
              <header className="mb-8">
                <h1 className="text-3xl font-black tracking-tight mb-2">Store Settings</h1>
                <p className="text-muted-foreground">Manage global store configurations and notifications.</p>
              </header>

              <Card className="rounded-[2.5rem] overflow-hidden border-border shadow-2xl">
                <CardHeader className="bg-muted/30 border-b border-border p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      <Settings size={28} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Announcement Bar</CardTitle>
                      <p className="text-xs text-muted-foreground">This message appears at the very top of the customer panel.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50">
                      <div>
                        <label className="text-sm font-bold uppercase tracking-widest text-foreground">Status</label>
                        <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Show or hide the bar</p>
                      </div>
                      <button 
                        onClick={() => setAnnouncementForm({ ...announcementForm, is_active: announcementForm.is_active ? 0 : 1 })}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all focus:outline-none ring-4 ring-primary/5 ${
                          announcementForm?.is_active ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-muted'
                        }`}
                      >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-md ${
                          announcementForm?.is_active ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold uppercase tracking-widest text-foreground">Message Content</label>
                        <span className={`text-[10px] font-bold ${announcementForm?.message?.length > 80 ? 'text-destructive' : 'text-primary'}`}>
                          {announcementForm?.message?.length || 0} / 80
                        </span>
                      </div>
                      <textarea
                        value={announcementForm?.message || ''}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                        placeholder="e.g. ✨ Big Sale! Get 20% off on all cakes this weekend! ✨"
                        className="w-full min-h-[140px] p-5 rounded-[1.5rem] border border-border bg-muted/10 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm leading-relaxed placeholder:text-muted-foreground/50 font-medium"
                      />
                    </div>

                    <Button 
                      onClick={async () => {
                         await updateAnnouncement(announcementForm);
                         toast.success('Announcement settings saved!');
                      }}
                      className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Save Configuration
                    </Button>
                  </div>

                  <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
                     <AlertCircle className="text-primary shrink-0" size={20} />
                     <div>
                       <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Expert Tip</p>
                       <p className="text-xs text-primary/70 leading-relaxed font-medium">
                         Keep your messages short and punchy. Use emojis (✨, 📢, 🎂) to grab attention without being distracting.
                       </p>
                     </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
