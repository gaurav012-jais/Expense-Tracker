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

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE E2E API TESTS ---');
  let userToken = '';
  let adminToken = '';
  
  const testUser = {
    name: 'Test User ' + Date.now(),
    email: `test${Date.now()}@example.com`,
    password: 'Password123'
  };

  const testAdmin = {
    name: 'Admin User ' + Date.now(),
    email: `admin${Date.now()}@example.com`,
    password: 'Password123',
    adminSecret: 'FINAI_ADMIN_SECRET_2026'
  };

  try {
    // 1. User Registration & Login
    console.log('\n[1] Testing Standard Auth...');
    const userRegRes = await fetchReq('POST', '/auth/register', testUser);
    userToken = userRegRes.data.token;
    console.log('✅ User Registration successful');

    const userLoginRes = await fetchReq('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ User Login successful');

    // 2. Admin Registration & Login
    console.log('\n[2] Testing Admin Auth...');
    const adminRegRes = await fetchReq('POST', '/auth/admin/register', testAdmin);
    adminToken = adminRegRes.data.token;
    console.log('✅ Admin Registration successful');

    const adminLoginRes = await fetchReq('POST', '/auth/admin/login', {
      email: testAdmin.email,
      password: testAdmin.password
    });
    console.log('✅ Admin Login successful');

    const userAuthHeaders = { Authorization: `Bearer ${userToken}` };
    const adminAuthHeaders = { Authorization: `Bearer ${adminToken}` };

    // 3. Testing Transactions
    console.log('\n[3] Testing Transactions...');
    const addTxRes = await fetchReq('POST', '/transactions', {
      merchant: 'Test Salary',
      amount: 5000,
      category: 'Salary',
      type: 'income',
      date: new Date()
    }, userAuthHeaders);
    console.log('✅ Transaction Added successful');

    const getTxRes = await fetchReq('GET', '/transactions', null, userAuthHeaders);
    console.log(`✅ Fetched Transactions (${getTxRes.data.transactions.length} found)`);


    // 5. Testing Notifications
    console.log('\n[5] Testing Notifications...');
    const notifRes = await fetchReq('GET', '/notifications', null, userAuthHeaders);
    console.log(`✅ Notifications fetched: ${notifRes.data.notifications.length} notifications`);

    // 6. Testing Recurring Transactions
    console.log('\n[6] Testing Recurring Transactions...');
    const addRecurringRes = await fetchReq('POST', '/recurring', {
      merchant: 'Netflix',
      amount: 15,
      category: 'Entertainment',
      frequency: 'monthly',
      type: 'expense',
      nextDate: new Date(),
      startDate: new Date()
    }, userAuthHeaders);
    console.log('✅ Recurring Transaction added');

    const getRecurringRes = await fetchReq('GET', '/recurring', null, userAuthHeaders);
    console.log(`✅ Fetched Recurring (${getRecurringRes.data.recurring.length} found)`);

    // 7. Testing Admin Routes
    console.log('\n[7] Testing Admin Routes...');
    const adminStatsRes = await fetchReq('GET', '/admin/stats', null, adminAuthHeaders);
    console.log(`✅ Admin Stats fetched: Total Users ${adminStatsRes.data.stats.users.total}`);

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error.message);
  }
}

runTests();
