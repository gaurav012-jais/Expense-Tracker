import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { adminRegister, clearError } from '../slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, User, Mail, Lock, ArrowRight, Loader2, Key } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminRegister = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    adminSecret: '' 
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (token && user?.role === 'admin') {
      navigate('/admin');
    }
  }, [token, user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(adminRegister(formData));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 relative z-10">
          <div className="w-20 h-20 mx-auto bg-slate-800 rounded-3xl flex items-center justify-center border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)] mb-4">
            <ShieldAlert className="text-amber-500" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Registration</h1>
          <p className="text-slate-400">Authorized personnel only</p>
        </div>

        <div className="glass-dark rounded-[2.5rem] p-8 border border-slate-700/50 shadow-2xl relative z-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-500" />
                </div>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                  placeholder="System Admin"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Work Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-500" />
                </div>
                <input 
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                  placeholder="admin@finai.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Secure Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-500" />
                </div>
                <input 
                  type="password" required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-amber-500 ml-1 uppercase tracking-wider">Admin Secret Key</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key size={18} className="text-amber-500/70" />
                </div>
                <input 
                  type="password" required
                  value={formData.adminSecret}
                  onChange={(e) => setFormData({...formData, adminSecret: e.target.value})}
                  className="w-full bg-slate-900/80 border border-amber-500/30 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                  placeholder="Enter system secret"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                <>Create Admin Account <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already authorized? <Link to="/admin/login" className="text-amber-400 font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
