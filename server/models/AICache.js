const mongoose = require('mongoose');

const aiCacheSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['insights', 'parse', 'suggest', 'usage_log'],
    required: true
  },
  response: {
    type: mongoose.Schema.Types.Mixed
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index for TTL (Time To Live)
aiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AICache', aiCacheSchema);
