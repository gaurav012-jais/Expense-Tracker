const express = require('express');
const router = express.Router();
const RecurringTransaction = require('../models/RecurringTransaction');
const { authMiddleware } = require('../middleware/authMiddleware');

// @route   GET /api/recurring
// @desc    Get all recurring transactions for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const recurring = await RecurringTransaction.find({ userId: req.user._id }).sort({ nextDate: 1 });
    res.json({ success: true, recurring });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/recurring
// @desc    Create a recurring transaction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { merchant, amount, category, type, frequency, interval, nextDate, endDate } = req.body;
    
    if (!merchant || !amount || !category || !type || !frequency || !nextDate) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields' });
    }

    const newRecurring = new RecurringTransaction({
      userId: req.user._id,
      merchant,
      amount: parseFloat(amount),
      category,
      type,
      frequency,
      interval: interval || 1,
      nextDate: new Date(nextDate),
      endDate: endDate ? new Date(endDate) : null
    });

    const saved = await newRecurring.save();
    res.status(201).json({ success: true, recurring: saved });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   PUT /api/recurring/:id
// @desc    Update a recurring transaction
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!recurring) {
      return res.status(404).json({ success: false, error: 'Recurring transaction not found' });
    }

    res.json({ success: true, recurring });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/recurring/:id
// @desc    Delete a recurring transaction
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!recurring) {
      return res.status(404).json({ success: false, error: 'Recurring transaction not found' });
    }

    res.json({ success: true, message: 'Recurring transaction deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
