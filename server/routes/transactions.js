const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { authMiddleware } = require('../middleware/authMiddleware');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

// Helper to detect anomaly using statistical analysis
const checkAnomaly = async (userId, category, amount) => {
  try {
    const previousTransactions = await Transaction.find({ 
      userId, 
      category, 
      type: 'expense' 
    }).sort({ date: -1 }).limit(10);

    if (previousTransactions.length < 3) return false;

    const amounts = previousTransactions.map(t => t.amount);
    const n = amounts.length;
    const mean = amounts.reduce((a, b) => a + b, 0) / n;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Flag if current amount is more than 2 standard deviations from mean
    return amount > mean + (2 * stdDev);
  } catch (error) {
    return false;
  }
};

// @route   GET /api/transactions
// @desc    Get all transactions for user with filtering and pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      category, 
      type, 
      search,
      minAmount,
      maxAmount,
      sortBy = 'date',
      order = 'desc',
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Build query
    let query = { userId: req.user._id, deletedAt: null };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (category) query.category = category;
    if (type) query.type = type;
    
    if (search) {
      query.merchant = { $regex: search, $options: 'i' };
    }
    
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + transactions.length < total
      }
    });
  } catch (err) {
    console.error('Get transactions error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
      deletedAt: null
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/transactions
// @desc    Create a transaction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { merchant, amount, category, date, type, isSubscription, note } = req.body;
    
    // Validate required fields
    if (!merchant || !amount || !category || !type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide all required fields' 
      });
    }

    let anomaly = false;
    if (type === 'expense') {
      anomaly = await checkAnomaly(req.user._id, category, amount);
    }

    const newTransaction = new Transaction({
      merchant,
      amount: parseFloat(amount),
      category,
      date: date || Date.now(),
      type,
      userId: req.user._id,
      isSubscription: isSubscription || false,
      anomaly,
      note: note || ''
    });

    const savedTransaction = await newTransaction.save();
    
    if (anomaly) {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: req.user._id,
        title: 'Anomaly Detected',
        message: `An unusually high expense of $${amount} was recorded in ${category}.`,
        type: 'anomaly'
      });
    }

    res.status(201).json({
      success: true,
      transaction: savedTransaction,
      anomalyFlagged: anomaly
    });
  } catch (err) {
    console.error('Create transaction error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update a transaction
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
      deletedAt: null
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    const { merchant, amount, category, date, type, isSubscription, note } = req.body;

    // Update fields if provided
    if (merchant !== undefined) transaction.merchant = merchant;
    if (amount !== undefined) transaction.amount = parseFloat(amount);
    if (category !== undefined) transaction.category = category;
    if (date !== undefined) transaction.date = date;
    if (type !== undefined) transaction.type = type;
    if (isSubscription !== undefined) transaction.isSubscription = isSubscription;
    if (note !== undefined) transaction.note = note;

    // Re-check anomaly if amount or category changed
    if ((amount || category) && transaction.type === 'expense') {
      transaction.anomaly = await checkAnomaly(
        req.user._id, 
        transaction.category, 
        transaction.amount
      );
    }

    await transaction.save();
    
    res.json({ success: true, transaction });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   GET /api/transactions/export/csv
// @desc    Export transactions as CSV
router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id, deletedAt: null }).sort({ date: -1 });
    const fields = ['date', 'merchant', 'category', 'type', 'amount', 'note'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(transactions.map(t => ({
      date: t.date.toISOString().split('T')[0],
      merchant: t.merchant,
      category: t.category,
      type: t.type,
      amount: t.amount,
      note: t.note
    })));

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error during export' });
  }
});

// @route   GET /api/transactions/export/pdf
// @desc    Export transactions as PDF
router.get('/export/pdf', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id, deletedAt: null }).sort({ date: -1 });
    
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.header('Content-Type', 'application/pdf');
    res.attachment('transactions.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Transaction Report', { align: 'center' });
    doc.moveDown();

    const tableTop = 100;
    const itemX = 30;
    const dateX = 130;
    const catX = 230;
    const typeX = 330;
    const amtX = 430;

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Merchant', itemX, tableTop);
    doc.text('Date', dateX, tableTop);
    doc.text('Category', catX, tableTop);
    doc.text('Type', typeX, tableTop);
    doc.text('Amount', amtX, tableTop);

    doc.moveTo(30, tableTop + 15).lineTo(560, tableTop + 15).stroke();

    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(10);

    transactions.forEach(t => {
      if (y > 750) {
        doc.addPage();
        y = 30;
      }
      doc.text(t.merchant.substring(0, 15), itemX, y);
      doc.text(t.date.toISOString().split('T')[0], dateX, y);
      doc.text(t.category, catX, y);
      doc.text(t.type, typeX, y);
      doc.text(`$${t.amount.toFixed(2)}`, amtX, y);
      y += 20;
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error during export' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Soft delete a transaction
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found or already deleted' });
    }

    res.json({ success: true, message: 'Transaction moved to trash' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/transactions/:id/restore
// @desc    Restore a soft-deleted transaction
router.post('/:id/restore', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found in trash' });
    }

    res.json({ success: true, message: 'Transaction restored successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   DELETE /api/transactions/:id/permanent
// @desc    Permanently delete a transaction
router.delete('/:id/permanent', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
      deletedAt: { $ne: null }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found in trash' });
    }

    res.json({ success: true, message: 'Transaction permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/transactions/trash/all
// @desc    Get all soft-deleted transactions
router.get('/trash/all', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id,
      deletedAt: { $ne: null }
    }).sort({ deletedAt: -1 });

    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   DELETE /api/transactions/bulk/delete
// @desc    Bulk soft delete transactions
router.delete('/bulk/delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide an array of transaction IDs' });
    }

    await Transaction.updateMany(
      { _id: { $in: ids }, userId: req.user._id, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );

    res.json({ success: true, message: `${ids.length} transactions moved to trash` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PATCH /api/transactions/bulk/category
// @desc    Bulk categorize transactions
router.patch('/bulk/category', authMiddleware, async (req, res) => {
  try {
    const { ids, category } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !category) {
      return res.status(400).json({ success: false, error: 'Please provide IDs and a valid category' });
    }

    await Transaction.updateMany(
      { _id: { $in: ids }, userId: req.user._id, deletedAt: null },
      { $set: { category } }
    );

    res.json({ success: true, message: `${ids.length} transactions updated` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/transactions/stats/overview
// @desc    Get transaction statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    // Current month stats
    const currentMonthTransactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: startOfMonth },
      deletedAt: null
    });

    // Last month stats
    const lastMonthTransactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: startOfLastMonth, $lt: startOfMonth },
      deletedAt: null
    });

    // Calculate totals
    let currentIncome = 0, currentExpense = 0;
    let lastMonthIncome = 0, lastMonthExpense = 0;

    currentMonthTransactions.forEach(t => {
      if (t.type === 'income') currentIncome += t.amount;
      else currentExpense += t.amount;
    });

    lastMonthTransactions.forEach(t => {
      if (t.type === 'income') lastMonthIncome += t.amount;
      else lastMonthExpense += t.amount;
    });

    // Get category breakdown for current month
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          date: { $gte: startOfMonth },
          deletedAt: null
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Get anomalies
    const anomalies = await Transaction.find({
      userId: req.user._id,
      anomaly: true,
      date: { $gte: startOfMonth },
      deletedAt: null
    }).sort({ date: -1 }).limit(5);

    res.json({
      success: true,
      stats: {
        currentMonth: {
          income: currentIncome,
          expense: currentExpense,
          netSavings: currentIncome - currentExpense
        },
        lastMonth: {
          income: lastMonthIncome,
          expense: lastMonthExpense,
          netSavings: lastMonthIncome - lastMonthExpense
        },
        categoryBreakdown,
        anomalies,
        expenseChange: lastMonthExpense > 0 
          ? ((currentExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1)
          : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
