const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  merchant: { 
    type: String, 
    required: [true, 'Merchant name is required'],
    trim: true
  },
  amount: { 
    type: Number, 
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: { 
    type: String, 
    required: [true, 'Category is required']
  },
  type: { 
    type: String, 
    enum: ['income', 'expense'], 
    required: [true, 'Transaction type is required'] 
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  interval: {
    type: Number,
    default: 1, // e.g., every 1 month
  },
  nextDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date, // optional
  },
  active: {
    type: Boolean,
    default: true
  },
  lastGenerated: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RecurringTransaction', recurringTransactionSchema);
