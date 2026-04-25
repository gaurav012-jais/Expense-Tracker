const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
           'Healthcare', 'Housing', 'Utilities', 'Education', 'Travel', 'Salary', 'Investment', 'Other']
  },
  monthlyLimit: {
    type: Number,
    required: [true, 'Monthly limit is required'],
    min: [1, 'Limit must be at least 1']
  },
  period: {
    type: String,
    enum: ['month', 'year'],
    default: 'month'
  },
  alertThreshold: {
    type: Number,
    default: 80,
    min: 50,
    max: 100
  }
}, {
  timestamps: true
});

// Prevent duplicate budgets for same category
budgetSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
