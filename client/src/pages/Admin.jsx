import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Users, Activity, ShieldAlert, ShieldCheck, Lock, Unlock, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useSelector((state) => state.auth);

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-rose-400 font-bold">Access Denied: Admins Only</div>;
  }

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const toggleBlockStatus = async (userId, currentStatus) => {
    try {
      const endpoint = currentStatus ? 'unblock' : 'block';
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`User ${currentStatus ? 'unblocked' : 'blocked'} successfully`);
      fetchAdminData();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading admin panel...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-emerald-400" /> Admin Dashboard
        </h2>
        <p className="text-slate-400 mt-1">Manage users and monitor system statistics.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-dark p-6 rounded-3xl border border-slate-700/50">
            <Users className="text-emerald-400 mb-3" size={24} />
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Total Users</p>
            <p className="text-3xl font-bold text-white mt-1">{stats.users.total}</p>
          </div>
          <div className="glass-dark p-6 rounded-3xl border border-slate-700/50">
            <Activity className="text-amber-400 mb-3" size={24} />
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Active Users</p>
            <p className="text-3xl font-bold text-white mt-1">{stats.users.active}</p>
          </div>
          <div className="glass-dark p-6 rounded-3xl border border-slate-700/50">
            <ShieldAlert className="text-rose-400 mb-3" size={24} />
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Blocked Users</p>
            <p className="text-3xl font-bold text-white mt-1">{stats.users.blocked}</p>
          </div>
          <div className="glass-dark p-6 rounded-3xl border border-slate-700/50">
            <div className="text-emerald-400 mb-3 font-bold text-xl">$</div>
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Total Volume</p>
            <p className="text-3xl font-bold text-white mt-1">${stats.transactions.volume.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="glass-dark rounded-3xl overflow-hidden border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50 bg-slate-800/30">
          <h3 className="text-xl font-bold text-white">System Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {users.map((u, idx) => (
                <motion.tr 
                  key={u._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-slate-200">{u.name}</p>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-400">{u.email}</td>
                  <td className="px-6 py-5">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                      u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                      u.isBlocked ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {u._id !== user._id && (
                      <button 
                        onClick={() => toggleBlockStatus(u._id, u.isBlocked)}
                        className={`p-2 rounded-lg transition-colors ${
                          u.isBlocked ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-rose-400 hover:bg-rose-500/10'
                        }`}
                        title={u.isBlocked ? 'Unblock User' : 'Block User'}
                      >
                        {u.isBlocked ? <Unlock size={18} /> : <Lock size={18} />}
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
