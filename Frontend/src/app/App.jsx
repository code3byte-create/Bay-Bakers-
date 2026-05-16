import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { CustomerPanel } from './components/CustomerPanel';
import { AdminPanel } from './components/AdminPanel';
import { POSPanel } from './components/POSPanel';
import { DeliveryPanel } from './components/DeliveryPanel';
import { Navigation } from './components/Navigation';

// Role-based Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, isLoading } = useStore();
  const toast = useToast();
  const location = useLocation();

  if (isLoading) return null; // Wait for auth to initialize

  if (!currentUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  const { currentUser } = useStore();
  
  return (
    <div className="relative">
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<CustomerPanel />} />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />

        {/* POS Routes */}
        <Route 
          path="/pos" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <POSPanel />
            </ProtectedRoute>
          } 
        />

        {/* Delivery Routes */}
        <Route 
          path="/delivery" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'delivery']}>
              <DeliveryPanel />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </StoreProvider>
    </ToastProvider>
  );
}
