const { GoogleGenerativeAI } = require("@google/generative-ai");
const cacheService = require('./cacheService');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = "gemini-2.0-flash";

// Existing method
const getFinancialContext = async (user, transactions, budgets) => {
  const summary = transactions.reduce((acc, t) => {
    if (t.type === 'income') acc.income += t.amount;
    else acc.expense += t.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const topCategories = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const anomalies = transactions.filter(t => t.anomaly).map(t => `${t.merchant}: $${t.amount}`);
  const recentTransactions = transactions.slice(0, 10).map(t => `${t.merchant} - $${t.amount} (${t.category})`);

  return `
    User: ${user.name}
    Monthly Income: $${user.monthlyIncome || 0}
    Current Month: Income $${summary.income}, Expense $${summary.expense}, Savings $${summary.income - summary.expense}
    Top Spending Categories: ${JSON.stringify(Object.entries(topCategories).sort((a,b) => b[1]-a[1]).slice(0, 5))}
    Recent Transactions: ${recentTransactions.join('; ')}
  `;
};

// Existing method
const chatWithAI = async (userContext, message) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
      You are "FinAI Assistant", a Certified Financial Planner. 
      
      USER FINANCIAL CONTEXT:
      ${userContext}
      
      USER QUESTION: "${message}"
      
      Provide concise, professional, and actionable financial advice. Use markdown for formatting. Keep responses under 150 words.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "I'm having trouble connecting to my AI services. Please try again in a moment.";
  }
};

// Existing method
const getInsights = async (userContext) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
      Analyze this financial data and return exactly 5 specific, actionable insights in valid JSON format:
      
      DATA: ${userContext}
      
      Return ONLY a JSON array with this exact structure (no markdown, no extra text):
      [
        {"type": "warning", "text": "...", "action": "View details"},
        {"type": "saving", "text": "...", "action": "Apply tip"},
        {"type": "insight", "text": "...", "action": "Learn more"},
        {"type": "alert", "text": "...", "action": "Take action"},
        {"type": "tip", "text": "...", "action": "Implement"}
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return getDefaultInsights();
  } catch (error) {
    console.error('Gemini Insights Error:', error);
    return getDefaultInsights();
  }
};

const getDefaultInsights = () => [
  { type: "tip", text: "Track your expenses daily to stay on top of your budget.", action: "Start tracking" },
  { type: "insight", text: "Review your subscriptions monthly to avoid unused charges.", action: "Review now" },
  { type: "saving", text: "Consider the 50/30/20 rule for budgeting.", action: "Learn more" }
];

// Existing method
const predictExpenses = async (userContext) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
      Based on this financial data, predict next month's expenses and provide savings recommendations:
      ${userContext}
      
      Return a brief markdown report with:
      1. Expected total expenses
      2. Top 3 categories to watch
      3. Potential savings opportunities
    `;
  
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini Prediction Error:', error);
    return "Unable to generate prediction at this time.";
  }
};

/**
 * NEW: Parse Natural Language Expense
 */
const parseNaturalLanguageExpense = async (userId, userText) => {
  // 1. Check Cache
  const cached = await cacheService.getCachedResponse(userId, 'parse', userText);
  if (cached) return cached;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const systemPrompt = `You are an expense parsing assistant. Extract amount, category, description, merchant, and date from user input. Return ONLY valid JSON.
Categories allowed: Food, Transport, Shopping, Entertainment, Bills, Healthcare, Education, Travel, Other`;

    const prompt = `${systemPrompt}\n\nUser Input: "${userText}"\n\nOutput format: {"amount": number, "category": string, "description": string, "merchant": string, "date": "YYYY-MM-DD"}`;

    // Log API call
    await cacheService.logApiCall(userId);

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Validate categories
      const allowedCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other'];
      if (!allowedCategories.includes(parsedData.category)) {
        parsedData.category = 'Other';
      }

      // Cache response
      await cacheService.setCachedResponse(userId, 'parse', userText, parsedData);

      return {
        data: parsedData,
        timestamp: new Date()
      };
    }
    throw new Error('Failed to parse JSON');
  } catch (error) {
    console.error('Gemini Parse Error (using fallback):', error);
    
    // Fallback Regex Parser
    const amountMatch = userText.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    let merchant = userText.replace(/\$?\s*\d+(?:\.\d{1,2})?/, '').trim();
    if (merchant.toLowerCase().includes('yesterday')) {
      merchant = merchant.replace(/yesterday/i, '').trim();
    }
    if (merchant.toLowerCase().includes('today')) {
      merchant = merchant.replace(/today/i, '').trim();
    }

    const parsedData = {
      amount,
      category: 'Other',
      description: userText,
      merchant: merchant || 'Expense',
      date: userText.toLowerCase().includes('yesterday') 
        ? new Date(Date.now() - 86400000).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    };
    
    return { data: parsedData, timestamp: new Date(), fallback: true };
  }
};

/**
 * NEW: Suggest Category
 */
const suggestCategory = async (userId, merchant, pastSpendingPatterns) => {
  const cacheInput = { merchant, pastSpendingPatterns };
  const cached = await cacheService.getCachedResponse(userId, 'suggest', cacheInput);
  if (cached) return cached;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const prompt = `Suggest the best category for the merchant "${merchant}".
Allowed categories: Food, Transport, Shopping, Entertainment, Bills, Healthcare, Education, Travel, Other.
User's past spending patterns: ${JSON.stringify(pastSpendingPatterns)}
Return ONLY the category name as a plain string.`;

    await cacheService.logApiCall(userId);
    const result = await model.generateContent(prompt);
    const category = result.response.text().trim();
    
    const allowedCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other'];
    const finalCategory = allowedCategories.includes(category) ? category : 'Other';

    await cacheService.setCachedResponse(userId, 'suggest', cacheInput, finalCategory);

    return {
      data: finalCategory,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Gemini Suggest Category Error (using fallback):', error);
    return { data: 'Other', timestamp: new Date(), fallback: true };
  }
};

/**
 * NEW: Spending Insights Portfolio
 */
const getPortfolioInsights = async (userId, expenseData) => {
  const cacheInput = expenseData.map(e => ({ amount: e.amount, category: e.category, date: e.date, merchant: e.merchant }));
  const cached = await cacheService.getCachedResponse(userId, 'insights', cacheInput);
  if (cached) return cached;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const prompt = `You are a financial intelligence AI. Analyze this expense data for the last 30 days and return actionable insights, spending anomalies, and saving tips.
Expenses: ${JSON.stringify(cacheInput)}
Return ONLY a valid JSON object with the following structure:
{
  "insights": ["insight1", "insight2"],
  "anomalies": ["anomaly1"],
  "tips": ["tip1", "tip2"]
}`;

    await cacheService.logApiCall(userId);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      await cacheService.setCachedResponse(userId, 'insights', cacheInput, data);
      return { data, timestamp: new Date() };
    }
    throw new Error('Failed to parse JSON');
  } catch (error) {
    console.error('Gemini Portfolio Insights Error (using fallback):', error);
    
    // Fallback Mock Data
    const total = expenseData.reduce((sum, e) => sum + e.amount, 0);
    const categories = [...new Set(expenseData.map(e => e.category))];
    
    const fallbackData = {
      insights: [
        `You have spent a total of $${total.toFixed(2)} across ${expenseData.length} transactions.`,
        categories.length > 0 
          ? `Your spending spans ${categories.length} different categories.`
          : "Start tracking your expenses to receive personalized breakdown."
      ],
      anomalies: total > 1000 ? ["High overall spending volume detected this month."] : [],
      tips: [
        "Consider the 50/30/20 rule: 50% Needs, 30% Wants, 20% Savings.",
        "Review recurring subscriptions that you might have forgotten about."
      ]
    };
    
    return { data: fallbackData, timestamp: new Date(), fallback: true };
  }
};


module.exports = {
  getFinancialContext,
  chatWithAI,
  getInsights,
  predictExpenses,
  parseNaturalLanguageExpense,
  suggestCategory,
  getPortfolioInsights
};