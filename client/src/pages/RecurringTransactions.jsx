import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Repeat, Plus, Calendar, Settings, Play, Pause, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const RecurringTransactions = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    category: 'Housing',
    type: 'expense',
    frequency: 'monthly',
    interval: 1,
    nextDate: new Date().toISOString().split('T')[0]
  });

  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
    'Healthcare', 'Housing', 'Utilities', 'Education', 'Travel', 'Salary', 'Investment', 'Other'
  ];

  const fetchRecurring = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/recurring', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data.recurring);
    } catch (error) {
      toast.error('Failed to load recurring transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/recurring', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Recurring transaction scheduled!');
      setIsModalOpen(false);
      fetchRecurring();
      setFormData({
        merchant: '', amount: '', category: 'Housing', type: 'expense',
        frequency: 'monthly', interval: 1, nextDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to schedule');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/recurring/${id}`, { active: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(currentStatus ? 'Paused schedule' : 'Resumed schedule');
      fetchRecurring();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring schedule?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/recurring/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Schedule deleted');
      fetchRecurring();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading schedules...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Repeat className="text-emerald-400" /> Recurring Transactions
          </h2>
          <p className="text-slate-400 mt-1">Automate your fixed expenses and income.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <motion.div 
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass-dark p-6 rounded-3xl border transition-all ${
              item.active ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'border-slate-700/50 opacity-70'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-200">{item.merchant}</h3>
                <span className="text-sm font-medium text-slate-400">{item.category}</span>
              </div>
              <div className={`p-2 rounded-xl ${item.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                <span className="font-bold text-lg">
                  {item.type === 'income' ? '+' : '-'}${item.amount}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Settings size={16} className="text-slate-500" />
                <span>Repeats <strong>{item.frequency}</strong> (every {item.interval})</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Calendar size={16} className="text-slate-500" />
                <span>Next: <strong>{new Date(item.nextDate).toLocaleDateString()}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                item.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
              }`}>
                {item.active ? 'Active' : 'Paused'}
              </span>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleToggleActive(item._id, item.active)}
                  className={`p-2 rounded-lg transition-colors ${
                    item.active ? 'text-amber-400 hover:bg-amber-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'
                  }`}
                  title={item.active ? 'Pause Schedule' : 'Resume Schedule'}
                >
                  {item.active ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button 
                  onClick={() => handleDelete(item._id)}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete Schedule"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-500 glass-dark rounded-3xl border border-slate-700/50">
            <Repeat size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No recurring transactions found</p>
            <p className="text-sm mt-2">Automate your fixed expenses like rent or subscriptions.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg glass-dark rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden relative"
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">New Recurring Schedule</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400 ml-1">Merchant / Name</label>
                      <input 
                        type="text" required
                        value={formData.merchant}
                        onChange={(e) => setFormData({...formData, merchant: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400 ml-1">Amount</label>
                      <input 
                        type="number" required
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                       <label className="text-sm font-medium text-slate-400 ml-1">Type</label>
                       <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, type: 'expense'})}
                            className={`flex-1 py-3 rounded-2xl border transition-all ${formData.type === 'expense' ? 'bg-rose-500/10 border-rose-500 text-rose-400' : 'border-slate-700 text-slate-500'}`}
                          >Expense</button>
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, type: 'income'})}
                            className={`flex-1 py-3 rounded-2xl border transition-all ${formData.type === 'income' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-500'}`}
                          >Income</button>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400 ml-1">Frequency</label>
                      <select 
                        value={formData.frequency}
                        onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400 ml-1">Starting From (Next Date)</label>
                      <input 
                        type="date" required
                        value={formData.nextDate}
                        onChange={(e) => setFormData({...formData, nextDate: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-semibold hover:text-white transition-colors">Cancel</button>
                    <button type="submit" className="flex-[2] btn-primary py-4">Save Schedule</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecurringTransactions;
