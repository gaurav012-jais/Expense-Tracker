const AICache = require('../models/AICache');
const crypto = require('crypto');

const AI_CACHE_TTL = parseInt(process.env.AI_CACHE_TTL) || 21600000; // 6 hours
const DAILY_API_LIMIT = parseInt(process.env.DAILY_API_LIMIT) || 20;

/**
 * Generate a cache key
 */
const generateKey = (userId, type, input) => {
  const inputStr = typeof input === 'object' ? JSON.stringify(input) : String(input);
  const hash = crypto.createHash('md5').update(inputStr).digest('hex');
  return `${userId}:${type}:${hash}`;
};

/**
 * Get cached response
 */
const getCachedResponse = async (userId, type, input) => {
  try {
    const key = generateKey(userId, type, input);
    const cached = await AICache.findOne({ key });
    
    if (cached) {
      return {
        data: cached.response,
        timestamp: cached.createdAt
      };
    }
    return null;
  } catch (error) {
    console.error('Cache Get Error:', error);
    return null;
  }
};

/**
 * Set cache response
 */
const setCachedResponse = async (userId, type, input, response) => {
  try {
    const key = generateKey(userId, type, input);
    const expiresAt = new Date(Date.now() + AI_CACHE_TTL);

    await AICache.findOneAndUpdate(
      { key },
      { 
        userId, 
        type, 
        response, 
        expiresAt 
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Cache Set Error:', error);
  }
};

/**
 * Check if user has reached daily limit
 */
const checkApiLimit = async (userId) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await AICache.countDocuments({
      userId,
      type: 'usage_log',
      createdAt: { $gte: twentyFourHoursAgo }
    });

    return {
      limitReached: count >= DAILY_API_LIMIT,
      usage: count,
      remaining: Math.max(0, DAILY_API_LIMIT - count)
    };
  } catch (error) {
    console.error('Limit Check Error:', error);
    return { limitReached: false, usage: 0, remaining: DAILY_API_LIMIT };
  }
};

/**
 * Log an API call
 */
const logApiCall = async (userId) => {
  try {
    const key = `usage:${userId}:${Date.now()}:${crypto.randomBytes(4).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL

    await AICache.create({
      userId,
      key,
      type: 'usage_log',
      expiresAt
    });
  } catch (error) {
    console.error('Log API Call Error:', error);
  }
};

module.exports = {
  getCachedResponse,
  setCachedResponse,
  checkApiLimit,
  logApiCall
};
