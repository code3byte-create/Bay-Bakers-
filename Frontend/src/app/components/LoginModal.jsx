import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from './Button';
import { Input } from './Input';
import { X, Lock, Mail, Phone, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginModal = ({ onClose }) => {
  const { login, register } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        const success = await login(email, password);
        if (success) {
          onClose();
        } else {
          setError('Invalid email or password');
        }
      } else {
        if (!name || !email || !phone || !password) {
          setError('Please fill all fields');
          setSubmitting(false);
          return;
        }
        const success = await register(name, email, phone, password);
        if (success) {
          onClose();
        } else {
          setError('Email already exists');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      {/* Static Blurred Cake Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110 blur-xl"
          style={{ 
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url(https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format)' 
          }}
        />
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-card w-full max-w-md rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] p-8 relative z-10 border border-white/10"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight">{isLogin ? 'Welcome Back' : 'Join Us'}</h2>
            <p className="text-sm text-muted-foreground">{isLogin ? 'Sign in to continue to Bay Bakers' : 'Create an account to start ordering'}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
               <User className="absolute left-3 top-[38px] text-muted-foreground" size={18} />
               <Input
                 label="Full Name"
                 type="text"
                 placeholder="Sarah Ahmed"
                 className="pl-10"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 required
               />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-[38px] text-muted-foreground" size={18} />
            <Input
              label="Email"
              type="email"
              placeholder="name@email.com"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {!isLogin && (
            <div className="relative">
              <Phone className="absolute left-3 top-[38px] text-muted-foreground" size={18} />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+92 300 1234567"
                className="pl-10"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          )}
          <div className="relative">
            <Lock className="absolute left-3 top-[38px] text-muted-foreground" size={18} />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              className="pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-bold"
            >
              {error}
            </motion.div>
          )}

          <Button 
            type="submit" 
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 mt-4" 
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-primary font-bold text-sm hover:underline"
          >
            {isLogin ? "New to Bay Bakers? Create Account" : 'Already a member? Sign In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

