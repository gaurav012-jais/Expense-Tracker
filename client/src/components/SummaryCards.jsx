import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Target } from 'lucide-react';

const SummaryCards = () => {
  const cards = [
    {
      title: 'Total Balance',
      value: '₹1,24,500.00',
      trend: '+12.5% from last month',
      trendType: 'up',
      icon: <ArrowUpRight size={24} color="var(--success)" />
    },
    {
      title: 'Monthly Spending',
      value: '₹42,300.00',
      trend: '75% of your budget used',
      trendType: 'warning',
      icon: <ArrowDownLeft size={24} color="var(--warning)" />
    },
    {
      title: 'Savings Goal',
      value: '₹2,50,000.00',
      trend: 'On track to reach in 3 months',
      trendType: 'info',
      icon: <Target size={24} color="var(--primary)" />
    }
  ];

  return (
    <div className="summary-cards">
      {cards.map((card, index) => (
        <div key={index} className="card summary-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{card.title}</span>
            {card.icon}
          </div>
          <div className="summary-value">{card.value}</div>
          <div className="summary-trend">
            <span style={{ color: card.trendType === 'up' ? 'var(--success)' : card.trendType === 'warning' ? 'var(--warning)' : 'var(--primary)' }}>
              {card.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
