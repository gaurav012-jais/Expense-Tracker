import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogin, clearError } from '../slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, user, requires2FA } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (requires2FA) {
      navigate('/verify-2fa');
    } else if (token && user?.role === 'admin') {
      navigate('/admin');
    } else if (token && user?.role === 'user') {
      navigate('/');
    }
  }, [token, user, requires2FA, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(adminLogin(formData));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 relative z-10">
          <div className="w-20 h-20 mx-auto bg-amber-500 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.4)] mb-6 transform rotate-12 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Admin Access</h1>
          <p className="text-slate-400 font-medium">Log in to manage FinAI</p>
        </div>

        <div className="glass-dark rounded-[2.5rem] p-8 border border-slate-700/50 shadow-2xl relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-slate-500" />
                </div>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                  placeholder="admin@finai.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-slate-500" />
                </div>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-amber-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                <>Secure Login <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Need an admin account? <Link to="/admin/register" className="text-amber-400 font-semibold hover:underline">Request access</Link>
          </p>
          <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
            <Link to="/login" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Return to User Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
