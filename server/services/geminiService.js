const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

  const anomalies = transactions.filter(t => t.anomaly).map(t => `${t.merchant}: ₹${t.amount}`);
  const recentTransactions = transactions.slice(0, 10).map(t => `${t.merchant} - ₹${t.amount} (${t.category})`);

  return `
    User: ${user.name}
    Monthly Income Setup: ₹${user.monthlyIncome || 0}
    Current Month: Income ₹${summary.income}, Expense ₹${summary.expense}, Savings ₹${summary.income - summary.expense}
    Top Spending Categories: ${JSON.stringify(Object.entries(topCategories).sort((a,b) => b[1]-a[1]).slice(0, 5))}
    Budgets: ${JSON.stringify(budgets.map(b => ({ category: b.category, limit: b.monthlyLimit, spent: b.spent })))}
    Flagged Anomalies: ${anomalies.join(', ') || 'None'}
    Recent Transactions: ${recentTransactions.join('; ')}
  `;
};

const chatWithAI = async (userContext, message) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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

const getInsights = async (userContext) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
    
    // Clean JSON string
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

const predictExpenses = async (userContext) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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

module.exports = {
  getFinancialContext,
  chatWithAI,
  getInsights,
  predictExpenses
};