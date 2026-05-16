import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Store, LayoutDashboard, CreditCard } from 'lucide-react';

export const Navigation = () => {
  const { currentUser } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const canAccessAdmin = currentUser?.role === 'admin';
  const canAccessPOS = currentUser?.role === 'admin' || currentUser?.role === 'staff';

  const isActive = (path) => location.pathname === path;

  return (
    <div className="hidden md:block fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
      <div className="bg-card border border-border rounded-xl shadow-lg p-2 flex flex-col gap-1">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
            isActive('/')
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Home"
        >
          <Store size={18} />
        </button>

        <button
          onClick={() => navigate('/admin')}
          disabled={!canAccessAdmin}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
            isActive('/admin')
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110'
              : canAccessAdmin
              ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
              : 'text-muted-foreground opacity-30 cursor-not-allowed'
          }`}
          title={!canAccessAdmin ? 'Admin access only' : 'Admin Dashboard'}
        >
          <LayoutDashboard size={18} />
        </button>

        <button
          onClick={() => navigate('/pos')}
          disabled={!canAccessPOS}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
            isActive('/pos')
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110'
              : canAccessPOS
              ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
              : 'text-muted-foreground opacity-30 cursor-not-allowed'
          }`}
          title={!canAccessPOS ? 'Staff/Admin access only' : 'POS Panel'}
        >
          <CreditCard size={18} />
        </button>
      </div>
    </div>
  );
};
