import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Sparkles, AlertTriangle, Lightbulb, CheckCircle, 
  Calendar, Loader2, RefreshCcw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const AIInsightsPanel = () => {
  const [insights, setInsights] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [tips, setTips] = useState([]);
  const [timestamp, setTimestamp] = useState(null);
  const [cacheStatus, setCacheStatus] = useState({ usage: 0, remaining: 20, limit: 20 });
  const [loading, setLoading] = useState(false);
  const { token } = useSelector((state) => state.auth);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Insights
      const insightsRes = await axios.post(
        'http://localhost:5000/api/ai/insights',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (insightsRes.data.success) {
        setInsights(insightsRes.data.insights || []);
        setAnomalies(insightsRes.data.anomalies || []);
        setTips(insightsRes.data.tips || []);
        setTimestamp(insightsRes.data.timestamp);
      }

      // Fetch Cache Status
      const statusRes = await axios.get(
        'http://localhost:5000/api/ai/cache-status',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (statusRes.data.success) {
        setCacheStatus({
          usage: statusRes.data.usage,
          remaining: statusRes.data.remaining,
          limit: statusRes.data.limit
        });
      }
    } catch (error) {
      console.error('Insights Fetch Error:', error);
      toast.error(error.response?.data?.error || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const formatTimeAgo = (timeStr) => {
    if (!timeStr) return '';
    const diffMs = new Date() - new Date(timeStr);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return new Date(timeStr).toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Sparkles className="text-purple-400 animate-pulse" size={28} />
            AI Spending Insights
          </h2>
          <p className="text-slate-400 mt-1">Smart financial advice tailored to your spending patterns</p>
        </div>
        
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-purple-500/25 border border-purple-400/20"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
          Refresh Insights
        </button>
      </div>

      {/* API Cache Status Badge */}
      <div className="flex flex-wrap gap-4 items-center bg-slate-800/30 border border-slate-700/50 rounded-2xl px-6 py-4 glass-dark">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Calendar size={16} className="text-slate-400" />
          <span>Last Generated:</span>
          <span className="font-semibold text-white">
            {timestamp ? formatTimeAgo(timestamp) : 'Never'}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-700 hidden md:block"></div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span>Gemini API Usage Today:</span>
          <span className={`font-bold px-2 py-0.5 rounded-md text-xs ${
            cacheStatus.remaining <= 5 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
            cacheStatus.remaining <= 10 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {cacheStatus.usage} / {cacheStatus.limit} Calls Used
          </span>
        </div>
        {timestamp && (
          <div className="ml-auto text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            * Results cached for 6 hours
          </div>
        )}
      </div>

      {loading && insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-purple-500" size={40} />
          <p className="text-slate-400 animate-pulse">Gemini is analyzing your expenses...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Insights Column */}
          <div className="space-y-6 lg:col-span-2">
            <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle className="text-emerald-400" size={22} />
              Personalized Insights
            </h3>
            {insights.length === 0 ? (
              <div className="glass-dark rounded-3xl p-8 text-center text-slate-500 border border-slate-800">
                No specific insights found for the last 30 days.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, idx) => (
                  <div key={idx} className="glass-dark rounded-3xl p-6 border border-slate-700/50 hover:border-purple-500/30 transition-all group">
                    <p className="text-slate-300 text-sm leading-relaxed group-hover:text-white transition-colors">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Tips Section */}
            <h3 className="text-xl font-semibold text-slate-200 pt-4 flex items-center gap-2">
              <Lightbulb className="text-amber-400" size={22} />
              Smart Saving Tips
            </h3>
            {tips.length === 0 ? (
              <div className="glass-dark rounded-3xl p-8 text-center text-slate-500 border border-slate-800">
                Add more transactions to unlock saving tips.
              </div>
            ) : (
              <div className="space-y-4">
                {tips.map((tip, idx) => (
                  <div key={idx} className="glass-dark rounded-2xl p-4 border border-slate-700/50 flex items-start gap-3">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                      <Lightbulb size={16} />
                    </div>
                    <p className="text-slate-300 text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anomalies Column */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="text-rose-400" size={22} />
              Spending Anomalies
            </h3>
            {anomalies.length === 0 ? (
              <div className="glass-dark rounded-3xl p-8 text-center text-emerald-400/80 bg-emerald-500/5 border border-emerald-500/20">
                🎉 No unusual spending detected in the last 30 days!
              </div>
            ) : (
              <div className="space-y-4">
                {anomalies.map((anomaly, idx) => (
                  <div key={idx} className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex items-start gap-3">
                    <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm text-slate-200 font-medium leading-relaxed">{anomaly}</p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mt-1 block">
                        Review Required
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
