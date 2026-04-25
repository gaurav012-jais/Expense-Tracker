import React, { useState, useEffect } from 'react';
import { Bell, Search, User, Menu, Check } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../slices/authSlice';
import axios from 'axios';

const Navbar = ({ onMenuClick }) => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchNotifications();
      // Optional: Poll every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch('http://localhost:5000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
      setIsNotificationOpen(false);
    } catch (error) {}
  };

  return (
    <header className="h-20 glass-dark flex items-center justify-between px-4 md:px-8 border-b border-slate-700/50 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-400 hover:text-white lg:hidden"
        >
          <Menu size={24} />
        </button>
        <div className="hidden md:flex items-center gap-4 bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-700/30 w-64 lg:w-96">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="bg-transparent border-none focus:outline-none text-slate-200 text-sm w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 relative">
        <button 
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          className="relative p-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
          )}
        </button>

        {isNotificationOpen && (
          <div className="absolute top-14 right-16 w-80 max-h-96 overflow-y-auto glass-dark rounded-2xl shadow-2xl border border-slate-700 z-50">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
              <h3 className="font-bold text-slate-200">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-emerald-400 hover:underline">Mark all read</button>
              )}
            </div>
            <div className="divide-y divide-slate-700/50">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-500 text-center">No notifications yet.</p>
              ) : (
                notifications.map(n => (
                  <div key={n._id} className={`p-4 hover:bg-slate-800/50 transition-colors ${!n.read ? 'bg-emerald-500/5' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-sm font-semibold ${!n.read ? 'text-emerald-400' : 'text-slate-300'}`}>{n.title}</p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-500 mt-2 block">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      {!n.read && (
                        <button onClick={() => handleMarkAsRead(n._id)} className="text-slate-500 hover:text-emerald-400 p-1">
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-3 pl-6 border-l border-slate-700/50">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-200">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Premium Plan</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
            {user?.name?.charAt(0) || <User size={20} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
