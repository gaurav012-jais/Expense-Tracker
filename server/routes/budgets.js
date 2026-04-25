const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { authMiddleware } = require('../middleware/authMiddleware');

// @route   GET /api/budgets
// @desc    Get all budgets for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id }).sort({ category: 1 });
    res.json({ success: true, budgets });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/budgets/status
// @desc    Get budget utilization and alerts
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id });
    
    // Calculate actual spending for each budget category in the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const statuses = await Promise.all(budgets.map(async (budget) => {
      const transactions = await Transaction.find({
        userId: req.user._id,
        category: budget.category,
        type: 'expense',
        date: { $gte: startOfMonth }
      });

      const actualSpent = transactions.reduce((acc, curr) => acc + curr.amount, 0);
      const utilization = (actualSpent / budget.monthlyLimit) * 100;

      let alert = null;
      let alertType = null;
      
      if (utilization >= 100) {
        alert = 'CRITICAL: Budget limit reached or exceeded!';
        alertType = 'danger';
      } else if (utilization >= budget.alertThreshold) {
        alert = `WARNING: You have used ${Math.round(utilization)}% of your ${budget.category} budget.`;
        alertType = 'warning';
      }

      return {
        _id: budget._id,
        category: budget.category,
        limit: budget.monthlyLimit,
        spent: parseFloat(actualSpent.toFixed(2)),
        remaining: parseFloat((budget.monthlyLimit - actualSpent).toFixed(2)),
        utilization: parseFloat(utilization.toFixed(1)),
        alert,
        alertType,
        period: budget.period
      };
    }));

    res.json({ success: true, statuses });
  } catch (err) {
    console.error('Budget status error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/budgets
// @desc    Create a budget
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { category, monthlyLimit, period, alertThreshold } = req.body;

    if (!category || !monthlyLimit) {
      return res.status(400).json({ 
        success: false, 
        error: 'Category and monthly limit are required' 
      });
    }

    // Check if budget already exists for this category
    const existingBudget = await Budget.findOne({ 
      userId: req.user._id, 
      category 
    });

    if (existingBudget) {
      return res.status(400).json({ 
        success: false, 
        error: `A budget for ${category} already exists` 
      });
    }

    const newBudget = new Budget({
      userId: req.user._id,
      category,
      monthlyLimit: parseFloat(monthlyLimit),
      period: period || 'month',
      alertThreshold: alertThreshold || 80
    });

    const budget = await newBudget.save();
    res.status(201).json({ success: true, budget });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update a budget
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const budget = await Budget.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }

    const { monthlyLimit, alertThreshold, period } = req.body;

    if (monthlyLimit !== undefined) budget.monthlyLimit = parseFloat(monthlyLimit);
    if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;
    if (period !== undefined) budget.period = period;

    await budget.save();
    res.json({ success: true, budget });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }

    res.json({ success: true, message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/budgets/subscriptions
// @desc    Identify recurring transactions/subscriptions
router.get('/subscriptions', authMiddleware, async (req, res) => {
  try {
    // Find transactions that might be subscriptions (same merchant, similar amounts)
    const transactions = await Transaction.find({ 
      userId: req.user._id, 
      type: 'expense' 
    }).sort({ merchant: 1, date: -1 });
    
    // Group by merchant + amount (within 10% variance)
    const groups = {};
    
    transactions.forEach(t => {
      // Create a key based on normalized merchant name and rounded amount
      const normalizedMerchant = t.merchant.toLowerCase().trim();
      const roundedAmount = Math.round(t.amount * 100) / 100;
      const key = `${normalizedMerchant}-${roundedAmount}`;
      
      if (!groups[key]) {
        groups[key] = {
          merchant: t.merchant,
          amount: roundedAmount,
          category: t.category,
          transactions: []
        };
      }
      groups[key].transactions.push(t);
    });

    // Filter to only those with 2+ occurrences within 35 days of each other
    const subscriptions = Object.values(groups)
      .filter(group => {
        if (group.transactions.length < 2) return false;
        
        // Check if transactions are within reasonable time frame (subscription pattern)
        const dates = group.transactions.map(t => new Date(t.date).getTime()).sort();
        const avgGap = (dates[dates.length - 1] - dates[0]) / (dates.length - 1);
        
        // Monthly subscriptions typically have 25-35 day gaps
        return avgGap > 20 * 24 * 60 * 60 * 1000 && avgGap < 40 * 24 * 60 * 60 * 1000;
      })
      .map(group => ({
        merchant: group.merchant,
        amount: group.amount,
        category: group.category,
        frequency: 'Monthly',
        count: group.transactions.length,
        lastDate: group.transactions[0].date,
        nextExpected: new Date(new Date(group.transactions[0].date).getTime() + 30 * 24 * 60 * 60 * 1000)
      }))
      .sort((a, b) => b.amount - a.amount);

    const totalMonthlyBurn = subscriptions.reduce((acc, sub) => acc + sub.amount, 0);

    res.json({ 
      success: true,
      subscriptions,
      totalMonthlyBurn: parseFloat(totalMonthlyBurn.toFixed(2)),
      count: subscriptions.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
