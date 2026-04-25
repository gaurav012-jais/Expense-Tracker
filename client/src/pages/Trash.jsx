import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const Trash = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state) => state.auth);

  const fetchTrash = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/transactions/trash/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data.transactions);
    } catch (error) {
      toast.error('Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/transactions/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Transaction restored');
      fetchTrash();
    } catch (error) {
      toast.error('Failed to restore');
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/transactions/${id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Transaction permanently deleted');
      fetchTrash();
    } catch (error) {
      toast.error('Failed to delete permanently');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading trash...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Trash2 className="text-rose-500" /> Trash
          </h2>
          <p className="text-slate-400 mt-1">Items here will be permanently deleted after 30 days.</p>
        </div>
      </div>

      <div className="glass-dark rounded-3xl overflow-hidden border border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Merchant</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Deleted On</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {items.map((t, idx) => (
                <motion.tr 
                  key={t._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-slate-200">{t.merchant}</p>
                    <span className="text-xs text-slate-500">{t.category}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-400">
                    {new Date(t.deletedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleRestore(t._id)}
                        className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Restore"
                      >
                        <RotateCcw size={18} />
                      </button>
                      <button 
                        onClick={() => handlePermanentDelete(t._id)}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Permanently"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="p-20 text-center text-slate-500 flex flex-col items-center">
              <AlertTriangle size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Trash is empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Trash;
