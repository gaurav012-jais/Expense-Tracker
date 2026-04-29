import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTransaction } from '../../slices/transactionSlice';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const AINaturalInput = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  const handleParse = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/ai/parse',
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const parsed = response.data.data;
        
        // Map to transaction model (type is usually expense for natural input)
        const transactionData = {
          merchant: parsed.merchant || parsed.description || 'AI Generated',
          amount: parsed.amount || 0,
          category: parsed.category || 'Other',
          type: 'expense',
          date: parsed.date || new Date().toISOString().split('T')[0]
        };

        // Add transaction
        const result = await dispatch(addTransaction(transactionData));
        if (addTransaction.fulfilled.match(result)) {
          toast.success(`Added: ${transactionData.merchant} - $${transactionData.amount}`);
          setText('');
        } else {
          toast.error('Failed to add parsed transaction');
        }
      }
    } catch (error) {
      console.error('AI Parse Error:', error);
      toast.error(error.response?.data?.error || 'Failed to parse input with AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-dark rounded-3xl p-6 border border-slate-700/50 shadow-xl mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30">
          <Sparkles className="text-purple-400" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">AI Quick Add</h3>
          <p className="text-xs text-slate-400">Type naturally: "Coffee $4.50 yesterday"</p>
        </div>
      </div>

      <form onSubmit={handleParse} className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g. "Dinner at Olive Garden for $45.20" or "Spent $15 on Uber today"'
          className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 text-sm transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-2xl font-medium shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Sparkles size={18} />
          )}
          <span>Parse & Add</span>
        </button>
      </form>
    </div>
  );
};

export default AINaturalInput;
