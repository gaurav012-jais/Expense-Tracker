const API_URL = 'http://localhost:5000/api';

async function fetchReq(method, path, body, headers = {}) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return { data };
}

async function runAITests() {
  console.log('--- STARTING AI ASSISTANT TESTS ---');
  let userToken = '';
  
  const testUser = {
    name: 'AI Test User ' + Date.now(),
    email: `aitest${Date.now()}@example.com`,
    password: 'Password123'
  };

  try {
    // 1. User Registration
    console.log('\n[1] Registering Test User...');
    const userRegRes = await fetchReq('POST', '/auth/register', testUser);
    userToken = userRegRes.data.token;
    console.log('✅ User Registration successful');

    const authHeaders = { Authorization: `Bearer ${userToken}` };

    // 2. Add Transactions
    console.log('\n[2] Adding Test Data (Transactions & Budgets)...');
    await fetchReq('POST', '/transactions', {
      merchant: 'Salary', amount: 5000, category: 'Salary', type: 'income', date: new Date()
    }, authHeaders);
    await fetchReq('POST', '/transactions', {
      merchant: 'Groceries', amount: 300, category: 'Food & Dining', type: 'expense', date: new Date()
    }, authHeaders);
    await fetchReq('POST', '/transactions', {
      merchant: 'Netflix', amount: 15, category: 'Entertainment', type: 'expense', date: new Date()
    }, authHeaders);
    
    // Add Budget
    await fetchReq('POST', '/budgets', {
      category: 'Food & Dining', monthlyLimit: 500
    }, authHeaders);
    
    console.log('✅ Test Data Added');

    // 3. Test AI Insights
    console.log('\n[3] Testing AI Insights...');
    const insightsRes = await fetchReq('GET', '/ai/insights', null, authHeaders);
    console.log('✅ Insights received:', JSON.stringify(insightsRes.data.insights, null, 2));

    // 4. Test AI Chat Questions
    console.log('\n[4] Testing AI Chat Questions...');
    
    const questions = [
      "What is my budget?",
      "How much did I spend?",
      "How much am I saving?",
      "What is my spending by category?",
      "Hello there!"
    ];

    for (const q of questions) {
      console.log(`\nQ: "${q}"`);
      const chatRes = await fetchReq('POST', '/ai/chat', { message: q }, authHeaders);
      console.log(`A: ${chatRes.data.reply}`);
    }

    console.log('\n🎉 ALL AI TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error.message);
  }
}

runAITests();
