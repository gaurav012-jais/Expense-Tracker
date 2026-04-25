import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions } from '../slices/transactionSlice';
import API from '../api/axios';
import { TrendingUp, TrendingDown, Wallet, Target, Sparkles, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { insights } = useSelector((state) => state.ai);
  const [summary, setSummary] = useState({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0, netSavings: 0 });
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [summaryRes, trendsRes, categoriesRes] = await Promise.all([
          API.get('/analytics/summary'),
          API.get('/analytics/trends'),
          API.get('/analytics/category')
        ]);
        
        setSummary(summaryRes.data.summary);
        setTrendData(trendsRes.data.trends || []);
        setCategoryData(categoriesRes.data.breakdown || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Financial Intelligence</h2>
          <p className="text-slate-400 mt-1">Track and manage your finances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-dark card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400"><Wallet size={24} /></div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Net Worth</h3>
          <p className="text-3xl font-bold text-white">${summary.totalBalance?.toLocaleString()}</p>
        </div>
        <div className="glass-dark card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400"><TrendingUp size={24} /></div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Monthly Income</h3>
          <p className="text-3xl font-bold text-white">${summary.monthlyIncome?.toLocaleString()}</p>
        </div>
        <div className="glass-dark card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400"><TrendingDown size={24} /></div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Monthly Spending</h3>
          <p className="text-3xl font-bold text-white">${summary.monthlyExpense?.toLocaleString()}</p>
        </div>
        <div className="glass-dark card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400"><Target size={24} /></div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Monthly Savings</h3>
          <p className="text-3xl font-bold text-white">${summary.netSavings?.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-dark card">
          <h3 className="text-xl font-bold text-white mb-8">Spending Trend (Last 6 Months)</h3>
          <div className="h-80 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px' }} />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">No spending data available</div>
            )}
          </div>
        </div>

        <div className="glass-dark card">
          <div className="flex items-center gap-2 mb-6 text-emerald-400">
            <Sparkles size={20} />
            <h3 className="text-xl font-bold text-white">AI Insights</h3>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-96 pr-2">
            {insights.length > 0 ? (
              insights.slice(0, 5).map((insight, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all">
                  <p className="text-sm text-slate-300 font-medium leading-relaxed mb-2">{insight.text}</p>
                  <button className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">{insight.action} <ChevronRight size={14} /></button>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8">Add transactions to get AI insights</div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-dark card">
        <h3 className="text-xl font-bold text-white mb-6">Spending by Category</h3>
        <div className="h-80">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="amount" label={({ name, percentage }) => `${name} (${percentage}%)`} labelLine={false}>
                  {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px' }} formatter={(value) => [`$${value.toLocaleString()}`, 'Spent']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">No category data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;