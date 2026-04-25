import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions, addTransaction } from '../slices/transactionSlice';
import { 
  Search, Filter, Plus, ChevronLeft, ChevronRight, 
  ArrowUpRight, ArrowDownRight, MoreVertical, Calendar,
  Tag, CreditCard, DollarSign, Download, Trash2, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const Transactions = () => {
  const dispatch = useDispatch();
  const { items, loading, total, pages, currentPage } = useSelector((state) => state.transactions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const { token } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    merchant: '', 
    amount: '', 
    category: 'Food & Dining', 
    type: 'expense', 
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(addTransaction(formData));
    if (addTransaction.fulfilled.match(result)) {
      toast.success('Transaction added!');
      setIsModalOpen(false);
      setFormData({ 
        merchant: '', 
        amount: '', 
        category: 'Food & Dining', 
        type: 'expense', 
        date: new Date().toISOString().split('T')[0] 
      });
    }
  };

  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
    'Healthcare', 'Housing', 'Utilities', 'Education', 'Travel', 'Salary', 'Investment', 'Other'
  ];

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(items.map(t => t._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm('Are you sure you want to delete selected transactions?')) return;
    try {
      await axios.delete('http://localhost:5000/api/transactions/bulk/delete', {
        headers: { Authorization: `Bearer ${token}` },
        data: { ids: selectedIds }
      });
      toast.success('Transactions moved to trash');
      setSelectedIds([]);
      dispatch(fetchTransactions());
    } catch (error) {
      toast.error('Failed to delete transactions');
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/transactions/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setIsExportMenuOpen(false);
    } catch (error) {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Transaction History</h2>
          <p className="text-slate-400 mt-1">Manage and track your financial activities</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Export
            </button>
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden z-20">
                <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700">Export as CSV</button>
                <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700">Export as PDF</button>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            New Transaction
          </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                {selectedIds.length}
              </span>
              <span className="text-emerald-400 font-medium">Transactions selected</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 transition-colors"
              >
                <Trash2 size={18} />
                Delete Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-dark rounded-3xl overflow-hidden border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50 flex flex-col md:flex-row justify-between gap-4 bg-slate-800/30">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search merchant or category..." 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-2.5 pl-12 pr-4 focus:outline-none focus:border-emerald-500 text-sm text-white"
              />
            </div>
            <button className="p-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all">
              <Filter size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 mr-2">Showing {items.length} of {total}</span>
            <div className="flex gap-1">
              <button className="p-2 rounded-lg bg-slate-800 text-slate-500 hover:text-white disabled:opacity-50" disabled>
                <ChevronLeft size={18} />
              </button>
              <button className="p-2 rounded-lg bg-slate-800 text-white">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Merchant</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {items.map((transaction, idx) => (
                <motion.tr 
                  key={transaction._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group transition-colors ${selectedIds.includes(transaction._id) ? 'bg-emerald-500/5' : 'hover:bg-white/5'}`}
                >
                  <td className="px-6 py-5">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
                      checked={selectedIds.includes(transaction._id)}
                      onChange={() => handleSelect(transaction._id)}
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {transaction.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{transaction.merchant}</p>
                        {transaction.anomaly && <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase font-black">Anomaly</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      <Tag size={12} />
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-400">
                    {new Date(transaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-sm font-bold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-700 transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <div className="p-20 text-center text-slate-500 font-medium">No transactions found</div>}
        </div>
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
                <h3 className="text-2xl font-bold text-white mb-6">New Transaction</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400 ml-1">Merchant</label>
                      <input 
                        type="text" required
                        value={formData.merchant}
                        onChange={(e) => setFormData({...formData, merchant: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:border-emerald-500 outline-none"
                        placeholder="Amazon, Starbucks..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400 ml-1">Amount</label>
                      <input 
                        type="number" required
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:border-emerald-500 outline-none"
                        placeholder="0.00"
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Date</label>
                    <input 
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-semibold hover:text-white transition-colors">Cancel</button>
                    <button type="submit" className="flex-[2] btn-primary py-4">Save Transaction</button>
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

export default Transactions;
