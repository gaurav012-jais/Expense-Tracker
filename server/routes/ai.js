const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: startOfMonth },
      deletedAt: null
    });

    if (transactions.length === 0) {
      return res.json({
        success: true,
        insights: [{
          type: 'info',
          title: 'Welcome!',
          text: 'Start tracking your expenses to receive personalized insights.',
          action: 'Add your first transaction'
        }]
      });
    }

    let totalExpense = 0;
    let totalIncome = 0;
    const categorySpending = {};

    transactions.forEach(t => {
      if (t.type === 'expense') {
        totalExpense += t.amount;
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      } else {
        totalIncome += t.amount;
      }
    });

    const insights = [];
    const sortedCategories = Object.entries(categorySpending).sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      const topPercentage = (topAmount / totalExpense) * 100;
      if (topPercentage > 40) {
        insights.push({
          type: 'warning',
          title: 'High Category Spending',
          text: `You spend ${topPercentage.toFixed(0)}% ($${topAmount.toFixed(2)}) of your expenses on ${topCategory}.`,
          action: `Review ${topCategory} spending`
        });
      }
    }

    if (totalIncome > 0 && totalExpense > totalIncome) {
      const overPercentage = ((totalExpense - totalIncome) / totalIncome * 100).toFixed(1);
      insights.push({
        type: 'danger',
        title: 'Overspending Alert',
        text: `You've spent ${overPercentage}% more than your income this month.`,
        action: 'View spending breakdown'
      });
    } else if (totalExpense < totalIncome && totalIncome > 0) {
      const savingsRate = (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1);
      insights.push({
        type: 'success',
        title: 'Great Savings!',
        text: `You're saving ${savingsRate}% of your income this month. Keep it up!`,
        action: 'View savings report'
      });
    }

    const budgets = await Budget.find({ userId: req.user._id });
    for (const budget of budgets) {
      const categorySpent = categorySpending[budget.category] || 0;
      const utilization = (categorySpent / budget.monthlyLimit) * 100;
      if (utilization >= 100) {
        insights.push({
          type: 'danger',
          title: 'Budget Exceeded',
          text: `You've exceeded your ${budget.category} budget by ${(utilization - 100).toFixed(0)}%.`,
          action: 'Manage budget'
        });
      } else if (utilization >= 80) {
        insights.push({
          type: 'warning',
          title: 'Budget Warning',
          text: `You've used ${utilization.toFixed(0)}% of your ${budget.category} budget.`,
          action: 'Review budget'
        });
      }
    }

    res.json({ success: true, insights: insights.slice(0, 5) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const lowerMessage = message.toLowerCase();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: startOfMonth },
      deletedAt: null
    });

    const budgets = await Budget.find({ userId: req.user._id });
    
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const savings = totalIncome - totalExpense;
    
    let reply = '';

    try {
      const geminiService = require('../services/geminiService');
      const userContext = await geminiService.getFinancialContext(req.user, transactions, budgets);
      const aiReply = await geminiService.chatWithAI(userContext, message);
      
      if (aiReply && !aiReply.includes("trouble connecting to my AI services")) {
        reply = aiReply;
      }
    } catch (geminiErr) {
      console.error('Gemini integration failed, using smart fallback:', geminiErr);
    }

    if (!reply) {
      if (lowerMessage.includes('biggest') || lowerMessage.includes('highest') || lowerMessage.includes('top') || lowerMessage.includes('most expensive')) {
        const expenses = transactions.filter(t => t.type === 'expense');
        if (expenses.length === 0) {
          reply = "You haven't recorded any expenses this month.";
        } else {
          const biggest = expenses.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
          reply = `Your biggest expense this month was for **${biggest.merchant || biggest.category}** costing **$${biggest.amount.toFixed(2)}**.`;
        }
      } else if (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('what are') || lowerMessage.includes('transaction')) {
        if (transactions.length === 0) {
          reply = "You have no transactions recorded this month.";
        } else {
          const list = transactions.map(t => `- ${t.type === 'income' ? '➕' : '➖'} **${t.merchant || t.category}**: $${t.amount.toFixed(2)} (${t.category})`).join('\n');
          reply = `Here are your transactions for this month:\n\n${list}`;
        }
      } else if (lowerMessage.includes('budget') || lowerMessage.includes('limit')) {
        if (budgets.length === 0) {
          reply = "You haven't set any budgets yet. You can create one in the Budgets section!";
        } else {
          const budgetSummary = budgets.map(b => {
            const spent = transactions.filter(t => t.type === 'expense' && t.category === b.category).reduce((sum, t) => sum + t.amount, 0);
            const percent = ((spent / b.monthlyLimit) * 100).toFixed(0);
            return `- **${b.category}**: $${spent.toFixed(2)} / $${b.monthlyLimit.toFixed(2)} (${percent}%)`;
          }).join('\n');
          reply = `Here is your budget status:\n\n${budgetSummary}`;
        }
      } else if (lowerMessage.includes('spend') || lowerMessage.includes('expense')) {
        const categoryTotals = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });
        const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        const breakdown = sorted.map(([cat, amt]) => `- **${cat}**: $${amt.toFixed(2)} (${((amt/totalExpense)*100).toFixed(0)}%)`).join('\n');
        
        reply = `You've spent a total of **$${totalExpense.toFixed(2)}** this month on ${transactions.filter(t => t.type === 'expense').length} transactions.\n\n**Breakdown by category:**\n${breakdown}`;
      } else if (lowerMessage.includes('save') || lowerMessage.includes('saving') || lowerMessage.includes('income')) {
        reply = `This month you earned **$${totalIncome.toFixed(2)}** and spent **$${totalExpense.toFixed(2)}**.\n\nYour net savings are **$${savings.toFixed(2)}** (${totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0}% of income).`;
      } else if (lowerMessage.includes('category')) {
        const categoryTotals = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });
        const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        reply = "Your spending by category:\n" + sorted.map(([cat, amt]) => `- **${cat}**: $${amt.toFixed(2)}`).join('\n');
      } else {
        reply = `I am your FinAI Assistant. Currently, I'm operating in local analytics mode. \n\nBased on your data:\n- **Income:** $${totalIncome.toFixed(2)}\n- **Expenses:** $${totalExpense.toFixed(2)}\n- **Net Savings:** $${savings.toFixed(2)}\n\nAsk me to list your transactions, find your biggest expense, or break down your categories!`;
      }
    }

    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;