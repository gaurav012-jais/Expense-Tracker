import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

const data = [
  { name: 'Mon', amount: 2400 },
  { name: 'Tue', amount: 1398 },
  { name: 'Wed', amount: 9800 },
  { name: 'Thu', amount: 3908 },
  { name: 'Fri', amount: 4800 },
  { name: 'Sat', amount: 3800 },
  { name: 'Sun', amount: 4300 },
];

const categoryData = [
  { name: 'Food', value: 400, color: '#6366F1' },
  { name: 'Bills', value: 300, color: '#10B981' },
  { name: 'Travel', value: 300, color: '#F59E0B' },
  { name: 'Shopping', value: 200, color: '#EF4444' },
];

export const SpendingChart = () => (
  <div className="card" style={{ height: '350px' }}>
    <h3 className="card-title">Weekly Spending Trend</h3>
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
          itemStyle={{ color: '#F1F5F9' }}
        />
        <Bar dataKey="amount" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const CategoryChart = () => (
  <div className="card" style={{ height: '350px' }}>
    <h3 className="card-title">Spending by Category</h3>
    <ResponsiveContainer width="100%" height="90%">
      <PieChart>
        <Pie
          data={categoryData}
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {categoryData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '-20px' }}>
      {categoryData.map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color }}></div>
          {c.name}
        </div>
      ))}
    </div>
  </div>
);
