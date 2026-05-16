import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { 
  Bike, Clock, Check, MapPin, Phone, Package, 
  Search, Filter, LogOut, ChevronRight, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DeliveryPanel = () => {
  const { orders, currentUser, logout, updateOrderStatus } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const toast = useToast();

  // Filter orders assigned to this delivery staff
  const assignedOrders = useMemo(() => {
    return orders.filter(order => 
      order.deliveryStaff === currentUser?.name &&
      (filterStatus === 'All' || order.status === filterStatus) &&
      (order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
       order.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [orders, currentUser, filterStatus, searchTerm]);

  const stats = {
    pending: assignedOrders.filter(o => o.status === 'Out for Delivery').length,
    completed: assignedOrders.filter(o => o.status === 'Delivered').length
  };

  const handleCompleteDelivery = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'Delivered');
      toast.success('Delivery marked as completed!');
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="bg-card border-b border-border sticky top-0 z-30 p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Bike size={24} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight">Delivery Panel</h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{currentUser?.name}</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="text-primary" size={20} />
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Pending</p>
                <p className="text-2xl font-black">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/10">
            <CardContent className="p-4 flex items-center gap-3">
              <Check className="text-success" size={20} />
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Completed Today</p>
                <p className="text-2xl font-black">{stats.completed}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text"
              placeholder="Search by Order ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            {['All', 'Out for Delivery', 'Delivered'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  filterStatus === status ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {assignedOrders.length === 0 ? (
            <div className="text-center py-20 bg-card border border-dashed border-border rounded-[2rem]">
               <Bike size={48} className="mx-auto mb-4 text-muted-foreground/20" />
               <p className="text-muted-foreground font-medium">No deliveries found.</p>
            </div>
          ) : (
            assignedOrders.map(order => (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="rounded-2xl sm:rounded-[2rem] overflow-hidden hover:shadow-xl transition-all border-border shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                          <Package size={24} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary uppercase tracking-widest">Order #{order.id.slice(-6)}</p>
                          <h3 className="text-xl font-black">{order.customerName}</h3>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        order.status === 'Delivered' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex gap-3">
                        <MapPin className="text-primary shrink-0" size={18} />
                        <div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Delivery Address</p>
                          <p className="text-sm font-medium leading-relaxed">{order.deliveryAddress}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Phone className="text-primary shrink-0" size={18} />
                        <div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Customer Contact</p>
                          <p className="text-sm font-bold">{order.customerPhone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-dashed border-border">
                       <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">Amount to Collect</span>
                          <span className="text-lg font-black text-primary">Rs.{order.total.toFixed(2)}</span>
                       </div>
                       
                       {order.status !== 'Delivered' && (
                         <Button 
                           onClick={() => handleCompleteDelivery(order.id)}
                           className="rounded-2xl h-12 sm:h-14 px-6 sm:px-8 shadow-xl shadow-primary/20 w-full sm:w-auto"
                         >
                           <Check size={20} className="mr-2" />
                           Mark as Delivered
                         </Button>
                       )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Floating Info */}
      <div className="p-4 bg-muted/30 text-center">
         <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">© 2026 Bay Bakers Management System</p>
      </div>
    </div>
  );
};
