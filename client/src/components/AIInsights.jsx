import React from 'react';
import { AlertCircle, TrendingDown, Info, ArrowRight } from 'lucide-react';

const AIInsights = () => {
  const insights = [
    {
      type: 'warning',
      icon: <TrendingDown size={18} />,
      title: 'Spending Pattern Alert',
      message: 'You’re spending 20% more on food this week compared to your average.',
      action: 'View breakdown'
    },
    {
      type: 'info',
      icon: <Info size={18} />,
      title: 'Subscription Optimization',
      message: 'Cancel your unused "Hulu" subscription to save ₹599/month.',
      action: 'Cancel now'
    },
    {
      type: 'danger',
      icon: <AlertCircle size={18} />,
      title: 'Anomaly Detected',
      message: 'Unusual transaction of ₹5,200 detected at "Unknown Merchant".',
      action: 'Report'
    }
  ];

  return (
    <div className="right-panel">
      <div className="card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          AI Financial Insights
        </h3>
        <div className="insights-list">
          {insights.map((insight, index) => (
            <div key={index} className={`insight-card ${insight.type}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                {insight.icon} {insight.title}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {insight.message}
              </p>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                {insight.action} <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.1) 100%)' }}>
        <h3 className="card-title">Savings Goal</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
          <span>New MacBook Pro</span>
          <span>75%</span>
        </div>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: '75%' }}></div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
          You're on track to reach your ₹1,50,000 goal by July!
        </p>
      </div>
    </div>
  );
};

export default AIInsights;
