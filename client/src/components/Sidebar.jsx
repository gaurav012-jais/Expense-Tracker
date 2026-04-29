import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, PieChart, MessageSquareCode, LogOut, Wallet, Shield, X, Trash2, Repeat, ShieldCheck, Sparkles } from 'lucide-react';

import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../slices/authSlice';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Transactions', icon: ReceiptText, path: '/transactions' },
    { name: 'Budgets', icon: PieChart, path: '/budgets' },
    { name: 'AI Assistant', icon: MessageSquareCode, path: '/ai-chat' },

    { name: 'AI Insights', icon: Sparkles, path: '/insights' },
    { name: 'Trash', icon: Trash2, path: '/trash' },
    { name: 'Security', icon: Shield, path: '/settings/security' },
  ];


  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin Panel', icon: ShieldCheck, path: '/admin' });
  }

  return (
    <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 glass-dark h-screen flex flex-col border-r border-slate-700/50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">FinAI</h1>
        </div>
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <button onClick={() => dispatch(logout())} className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-2xl transition-all duration-300">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;