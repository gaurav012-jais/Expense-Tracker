const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const allTransactions = await Transaction.find({ userId: req.user._id, deletedAt: null });
    const monthTransactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: startOfMonth },
      deletedAt: null
    });

    let totalBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    allTransactions.forEach(t => {
      if (t.type === 'income') totalBalance += t.amount;
      else totalBalance -= t.amount;
    });

    monthTransactions.forEach(t => {
      if (t.type === 'income') monthlyIncome += t.amount;
      else monthlyExpense += t.amount;
    });

    res.json({
      success: true,
      summary: {
        totalBalance: parseFloat(totalBalance.toFixed(2)),
        monthlyIncome: parseFloat(monthlyIncome.toFixed(2)),
        monthlyExpense: parseFloat(monthlyExpense.toFixed(2)),
        netSavings: parseFloat((monthlyIncome - monthlyExpense).toFixed(2)),
        savingsRate: monthlyIncome > 0 ? parseFloat(((monthlyIncome - monthlyExpense) / monthlyIncome * 100).toFixed(1)) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/trends', authMiddleware, async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const trends = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate },
          deletedAt: null
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const trendData = trends.map(t => ({
      date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
      amount: t.expense,
      label: new Date(t._id.year, t._id.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }));

    res.json({ success: true, trends: trendData });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/category', authMiddleware, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let startDate = new Date();
    if (period === 'month') {
      startDate.setDate(1);
    } else if (period === 'year') {
      startDate.setMonth(0, 1);
    }
    startDate.setHours(0, 0, 0, 0);

    const categories = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          date: { $gte: startDate },
          deletedAt: null
        }
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const totalSpending = categories.reduce((acc, curr) => acc + curr.total, 0);
    
    const breakdown = categories.map(c => ({
      category: c._id,
      amount: parseFloat(c.total.toFixed(2)),
      count: c.count,
      percentage: totalSpending > 0 ? parseFloat(((c.total / totalSpending) * 100).toFixed(1)) : 0
    }));

    res.json({ success: true, breakdown, totalSpending: parseFloat(totalSpending.toFixed(2)), period });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;