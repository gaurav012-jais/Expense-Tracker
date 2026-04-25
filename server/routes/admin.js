const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Apply both auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// @route   GET /api/admin/users
// @desc    Get all users with pagination and search
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'blocked') {
      query.isBlocked = true;
    } else if (status === 'active') {
      query.isBlocked = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user details
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get user stats
    const transactionCount = await Transaction.countDocuments({ userId: user._id });
    const totalSpent = await Transaction.aggregate([
      { $match: { userId: user._id, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        transactionCount,
        totalSpent: totalSpent[0]?.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/block
// @desc    Block a user
router.put('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot block another admin' 
      });
    }

    user.isBlocked = true;
    await user.save();

    res.json({ 
      success: true, 
      message: `User ${user.name} has been blocked`,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/unblock
// @desc    Unblock a user
router.put('/users/:id/unblock', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.isBlocked = false;
    await user.save();

    res.json({ 
      success: true, 
      message: `User ${user.name} has been unblocked`,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Change user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ 
      success: true, 
      message: `User role updated to ${role}`,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user and their transactions
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete an admin user' 
      });
    }

    // Delete user's transactions
    await Transaction.deleteMany({ userId: user._id });
    
    // Delete user
    await user.deleteOne();

    res.json({ 
      success: true, 
      message: 'User and all associated data deleted' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      totalTransactions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlocked: false }),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ createdAt: { $gte: startOfWeek } }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Transaction.countDocuments()
    ]);

    // Get system-wide transaction stats
    const transactionStats = await Transaction.aggregate([
      { $group: { 
        _id: null, 
        totalVolume: { $sum: '$amount' },
        expenseTotal: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        incomeTotal: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        count: { $sum: 1 }
      }}
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          blocked: blockedUsers,
          newThisWeek: newUsersThisWeek,
          newThisMonth: newUsersThisMonth
        },
        transactions: {
          total: totalTransactions,
          volume: transactionStats[0]?.totalVolume || 0,
          expenseVolume: transactionStats[0]?.expenseTotal || 0,
          incomeVolume: transactionStats[0]?.incomeTotal || 0
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/admin/recent-activity
// @desc    Get recent user registrations and activity
router.get('/recent-activity', async (req, res) => {
  try {
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, recentUsers });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
