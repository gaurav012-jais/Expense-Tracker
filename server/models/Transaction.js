const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  merchant: { 
    type: String, 
    required: [true, 'Merchant name is required'],
    trim: true,
    maxlength: [100, 'Merchant name cannot exceed 100 characters']
  },
  amount: { 
    type: Number, 
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    enum: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
           'Healthcare', 'Housing', 'Utilities', 'Education', 'Travel', 'Salary', 'Investment', 'Other']
  },
  date: { 
    type: Date, 
    default: Date.now,
    max: Date.now // Cannot be in the future
  },
  type: { 
    type: String, 
    enum: ['income', 'expense'], 
    required: [true, 'Transaction type is required'] 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  isSubscription: { 
    type: Boolean, 
    default: false 
  },
  anomaly: { 
    type: Boolean, 
    default: false 
  },
  note: { 
    type: String, 
    default: '',
    maxlength: [500, 'Note cannot exceed 500 characters']
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
