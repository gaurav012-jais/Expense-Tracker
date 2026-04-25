import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers, blockUser, unblockUser } from '../slices/adminSlice';
import {
  Shield,
  UserCheck,
  UserX,
  Users,
  ReceiptText,
  Ban,
  CheckCircle2,
  Search,
} from 'lucide-react';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const { users, loading } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');

  const tokenVal = token || '';

  useEffect(() => {
    if (tokenVal) {
      dispatch(fetchAllUsers(tokenVal));
    }
  }, [dispatch, tokenVal]);

  const handleBlock = async (userId) => {
    if (!confirm('Block this user? They will no longer be able to log in.')) return;
    await dispatch(blockUser({ token: tokenVal, userId }));
  };

  const handleUnblock = async (userId) => {
    await dispatch(unblockUser({ token: tokenVal, userId }));
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = users.filter((u) => !u.isBlocked).length;
  const blockedCount = users.filter((u) => u.isBlocked).length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield size={24} className="text-emerald-400" />
          Admin Panel
        </h2>
        <p className="text-sm text-slate-400 mt-1">Manage users and system access</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-dark card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-400">Total Users</p>
          <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
        </div>
        <div className="glass-dark card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <UserCheck size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-400">Active Users</p>
          <p className="text-2xl font-bold text-white mt-1">{activeCount}</p>
        </div>
        <div className="glass-dark card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <UserX size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-400">Blocked Users</p>
          <p className="text-2xl font-bold text-white mt-1">{blockedCount}</p>
        </div>
        <div className="glass-dark card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Shield size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-400">Admins</p>
          <p className="text-2xl font-bold text-white mt-1">{adminCount}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-dark overflow-hidden">
        <div className="p-4 border-b border-slate-700/30">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Expenses</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">Loading...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-yellow' : 'badge-blue'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-slate-300">
                        <ReceiptText size={14} /> {u.expenseCount}
                      </span>
                    </td>
                    <td>
                      {u.isBlocked ? (
                        <span className="badge badge-red">Blocked</span>
                      ) : (
                        <span className="badge badge-green">Active</span>
                      )}
                    </td>
                    <td className="text-slate-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      {u._id === user?._id ? (
                        <span className="text-xs text-slate-500 italic">You</span>
                      ) : u.isBlocked ? (
                        <button
                          onClick={() => handleUnblock(u._id)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <CheckCircle2 size={14} />
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlock(u._id)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <Ban size={14} />
                          Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
