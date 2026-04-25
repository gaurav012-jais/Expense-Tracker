const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// ✅ Validation rules
const registerValidation = [
  body('name', 'Name is required').not().isEmpty().trim(),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password must be at least 8 characters with 1 uppercase and 1 number')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
];

const loginValidation = [
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password is required').exists()
];

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false,
        error: 'An account with this email already exists' 
      });
    }

    // Create new user (default role is 'user')
    user = new User({
      name,
      email,
      password
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        currencyPreference: user.currencyPreference,
        monthlyIncome: user.monthlyIncome
      }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error during registration' 
    });
  }
});

// @route   POST /api/auth/admin/register
// @desc    Register a new admin
router.post('/admin/register', registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }

  const { name, email, password, adminSecret } = req.body;

  // Verify admin secret
  const validSecret = process.env.ADMIN_SECRET || 'FINAI_ADMIN_SECRET_2026';
  if (adminSecret !== validSecret) {
    return res.status(401).json({ success: false, error: 'Invalid admin secret key' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    user = new User({ name, email, password, role: 'admin' });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during admin registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }

  const { email, password } = req.body;

  try {
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // ✅ Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false,
        error: 'Your account has been suspended. Please contact support.' 
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // ✅ Check if 2FA is enabled
    if (user.is2FAEnabled) {
      return res.json({
        success: true,
        requires2FA: true,
        email: user.email // Send email back to be used in 2FA verification step
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        currencyPreference: user.currencyPreference,
        monthlyIncome: user.monthlyIncome
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error during login' 
    });
  }
});

// @route   POST /api/auth/admin/login
// @desc    Authenticate admin & get token
router.post('/admin/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin privileges required.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    if (user.is2FAEnabled) {
      return res.json({ success: true, requires2FA: true, email: user.email });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during admin login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, profilePicture, currencyPreference, monthlyIncome } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (name) user.name = name;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (currencyPreference) user.currencyPreference = currencyPreference;
    if (monthlyIncome !== undefined) user.monthlyIncome = monthlyIncome;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        currencyPreference: user.currencyPreference,
        monthlyIncome: user.monthlyIncome
      }
    });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
router.post('/forgot-password', [
  body('email', 'Please include a valid email').isEmail()
], async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const resetUrl = `${req.get('origin')}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please make a POST request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message
      });
      res.json({ success: true, message: 'Email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ success: false, error: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
router.post('/reset-password/:token', [
  body('password', 'Password must be at least 8 characters').isLength({ min: 8 })
], async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/auth/enable-2fa
// @desc    Generate 2FA secret and QR code
router.post('/enable-2fa', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const secret = speakeasy.generateSecret({ name: `FinAI (${user.email})` });
    
    user.twoFASecret = secret.base32;
    await user.save();

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ success: true, qrCodeUrl, secret: secret.base32 });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/auth/verify-2fa
// @desc    Verify and enable 2FA
router.post('/verify-2fa', authMiddleware, async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    user.is2FAEnabled = true;
    await user.save();

    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/auth/login-2fa
// @desc    Verify 2FA after login
router.post('/login-2fa', async (req, res) => {
  const { email, token } = req.body;
  try {
    const user = await User.findOne({ email }).select('+twoFASecret');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    const authToken = generateToken(user._id);
    res.json({
      success: true,
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
