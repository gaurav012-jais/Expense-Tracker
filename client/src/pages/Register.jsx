import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../slices/authSlice';
import { Wallet, Mail, Lock, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const { loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple frontend validation before sending
    if (formData.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    
    const resultAction = await dispatch(register(formData));
    if (register.fulfilled.match(resultAction)) {
      toast.success('Welcome to FinAI!');
      navigate('/');
    } else {
      // Handle the errors array from backend
      const errorMsg = resultAction.payload?.error || 
                       resultAction.payload?.errors?.[0]?.message || 
                       'Registration failed';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-dark-bg to-dark-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 mx-auto mb-6 -rotate-12">
            <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Join FinAI</h1>
          <p className="text-slate-400">Start your wealth-building journey today</p>
        </div>

        <div className="glass-dark p-8 rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="name@company.com"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="At least 8 characters"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white"
                  required
                  autoComplete="new-password"
                />
              </div>
              <p className="text-[10px] text-slate-500 px-1 uppercase tracking-tighter">Must include 1 uppercase letter and 1 number</p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4 mt-4"
            >
              {loading ? 'Creating Account...' : 'Get Started'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-400 text-sm">
            Already have an account? <Link to="/login" className="text-emerald-400 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
