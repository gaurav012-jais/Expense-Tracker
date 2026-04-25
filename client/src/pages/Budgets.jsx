import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { 
  Plus, PieChart, TrendingUp, AlertTriangle, 
  CheckCircle2, CreditCard, Flame
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const BudgetCard = ({ budget }) => {
  const percentage = Math.min(budget.utilization, 100);
  const isOver = budget.utilization >= 100;
  const isWarning = budget.utilization >= 80 && !isOver;

  let colorClass = "bg-emerald-500";
  if (isOver) colorClass = "bg-rose-500";
  else if (isWarning) colorClass = "bg-amber-500";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-dark card border border-slate-700/50"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tight">{budget.category}</h3>
          <p className="text-sm text-slate-400">Monthly Target</p>
        </div>
        <div className={`p-2 rounded-xl border ${isOver ? 'border-rose-500/30 text-rose-400 bg-rose-500/5' : isWarning ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'}`}>
          {isOver ? <AlertTriangle size={24} /> : isWarning ? <Flame size={24} /> : <CheckCircle2 size={24} />}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 font-medium">${budget.spent.toLocaleString()} spent</span>
          <span className="text-white font-bold">${budget.limit.toLocaleString()}</span>
        </div>
        
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${colorClass} shadow-lg shadow-${colorClass.split('-')[1]}-500/20`}
          />
        </div>

        <div className="flex justify-between items-center pt-2">
            <span className={`text-xs font-bold px-2 py-1 rounded ${isOver ? 'bg-rose-500/10 text-rose-400' : isWarning ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {budget.utilization}% Used
            </span>
            {budget.alert && (
                <span className="text-[10px] text-slate-500 font-medium italic">
                    {budget.alert.split(':')[0]}
                </span>
            )}
        </div>
      </div>
    </motion.div>
  );
};

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [subs, setSubs] = useState({ subscriptions: [], totalMonthlyBurn: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Food & Dining', monthlyLimit: '', alertThreshold: 80
  });

  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
    'Healthcare', 'Housing', 'Utilities', 'Education', 'Travel', 'Salary', 'Investment', 'Other'
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        API.get('/budgets/status'),
        API.get('/budgets/subscriptions')
      ]);
      setBudgets(bRes.data.statuses || []);
      setSubs(sRes.data);
    } catch (err) {
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/budgets', formData);
      toast.success('Budget created successfully!');
      setIsModalOpen(false);
      setFormData({ category: 'Food & Dining', monthlyLimit: '', alertThreshold: 80 });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create budget');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Budget Planner</h2>
          <p className="text-slate-400 mt-1">Monitor limits and optimize your monthly burn rate</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Create Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((b, idx) => (
          <BudgetCard key={idx} budget={b} />
        ))}
        {budgets.length === 0 && !loading && (
          <div className="lg:col-span-3 glass-dark p-12 text-center rounded-3xl border border-dashed border-slate-700">
            <p className="text-slate-500 mb-4">No active budgets found.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-emerald-400 font-bold hover:underline"
            >Setup your first budget category</button>
          </div>
        )}
      </div>

      {/* Subscription Section ... existing code ... */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div className="lg:col-span-2 glass-dark card overflow-hidden border border-slate-700/50">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <CreditCard size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">Active Subscriptions</h3>
            </div>
            <div className="space-y-3">
                {subs.subscriptions.map((sub, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-slate-600 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-bold">
                                {sub.merchant.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-200">{sub.merchant}</p>
                                <p className="text-xs text-slate-500">{sub.frequency}</p>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-white">${sub.amount}</p>
                    </div>
                ))}
                {subs.subscriptions.length === 0 && <p className="text-slate-500 text-sm italic">No recurring subscriptions detected yet.</p>}
            </div>
        </div>

        <div className="glass-dark card bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <h4 className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2">Monthly Burn Rate</h4>
            <p className="text-4xl font-black text-white mb-6">${subs.totalMonthlyBurn.toLocaleString()}</p>
            <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Projected Annual</span>
                    <span className="text-white font-bold">${(subs.totalMonthlyBurn * 12).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Based on your active subscriptions and recurring bills. Consider cancellations to reduce this number.
                </p>
                <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all mt-4 border border-white/5">
                    Analyze with Gemini AI
                </button>
            </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md glass-dark rounded-[2.5rem] border border-slate-700 p-8 relative"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Create New Budget</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:border-emerald-500 outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Monthly Limit ($)</label>
                <input 
                  type="number" required
                  value={formData.monthlyLimit}
                  onChange={(e) => setFormData({...formData, monthlyLimit: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:border-emerald-500 outline-none"
                  placeholder="e.g. 500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Alert Threshold (%)</label>
                <input 
                  type="number" min="50" max="100"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({...formData, alertThreshold: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-semibold">Cancel</button>
                <button type="submit" className="flex-[2] btn-primary py-4">Save Budget</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
