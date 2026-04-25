import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      toast.success('Reset link sent to your email!');
      setSent(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-dark-bg to-dark-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 mx-auto mb-6 rotate-12">
            <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-slate-400">No worries, we'll send you reset instructions.</p>
        </div>

        <div className="glass-dark p-8 rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
          {sent ? (
            <div className="text-center space-y-6">
              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <p className="text-emerald-400 text-sm font-medium">
                  Check your email for the reset link.
                </p>
              </div>
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-emerald-400 font-semibold hover:underline"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset Link'}
                {!loading && <ArrowRight size={18} />}
              </button>

              <p className="text-center text-slate-400 text-sm">
                Remember your password? <Link to="/login" className="text-emerald-400 font-semibold hover:underline">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
