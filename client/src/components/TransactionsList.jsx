import React from 'react';
import { ShoppingBag, Coffee, Home, Car, Film, DollarSign } from 'lucide-react';

const TransactionsList = () => {
  const transactions = [
    { id: 1, merchant: 'Netflix', amount: -15.99, category: 'Entertainment', icon: <Film size={18} />, color: '#E11D48', date: 'Today' },
    { id: 2, merchant: 'Starbucks', amount: -5.50, category: 'Food', icon: <Coffee size={18} />, color: '#10B981', date: 'Today' },
    { id: 3, merchant: 'Apple Store', amount: -1200.00, category: 'Shopping', icon: <ShoppingBag size={18} />, color: '#6366F1', date: 'Yesterday' },
    { id: 4, merchant: 'Uber', amount: -25.40, category: 'Travel', icon: <Car size={18} />, color: '#F59E0B', date: '22 Apr' },
    { id: 5, merchant: 'Salary', amount: 5000.00, category: 'Income', icon: <DollarSign size={18} />, color: '#10B981', date: '20 Apr' },
  ];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className="card-title" style={{ margin: 0 }}>Recent Transactions</h3>
        <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>View All</button>
      </div>
      <div className="transaction-list">
        {transactions.map((t) => (
          <div key={t.id} className="transaction-item">
            <div className="transaction-info">
              <div className="category-icon" style={{ color: t.color }}>
                {t.icon}
              </div>
              <div>
                <div style={{ fontWeight: '600' }}>{t.merchant}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.category} • {t.date}</div>
              </div>
            </div>
            <div style={{ fontWeight: '700', color: t.amount > 0 ? 'var(--success)' : 'var(--text-main)' }}>
              {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionsList;
