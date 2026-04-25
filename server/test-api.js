const speakeasy = require('speakeasy');

const API_URL = 'http://localhost:5000/api/auth';
let token;
let twoFASecret;

async function fetchAPI(endpoint, method, body, customHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...customHeaders };
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data } };
  return { data };
}

async function testFlow() {
  try {
    const email = `testuser_${Date.now()}@test.com`;
    console.log('--- Registering User ---');
    let res = await fetchAPI('/register', 'POST', {
      name: 'Test User',
      email: email,
      password: 'Password123!'
    });
    console.log('Registration success:', !!res.data.token);
    token = res.data.token;

    console.log('--- Enabling 2FA ---');
    res = await fetchAPI('/enable-2fa', 'POST', {}, { Authorization: `Bearer ${token}` });
    console.log('Enable 2FA success:', !!res.data.secret);
    twoFASecret = res.data.secret;

    const otp = speakeasy.totp({
      secret: twoFASecret,
      encoding: 'base32'
    });

    console.log('--- Verifying 2FA ---');
    res = await fetchAPI('/verify-2fa', 'POST', { token: otp }, { Authorization: `Bearer ${token}` });
    console.log('Verify 2FA success:', res.data.success);

    console.log('--- Testing Login without OTP (should return requires2FA) ---');
    res = await fetchAPI('/login', 'POST', {
      email: email,
      password: 'Password123!'
    });
    console.log('Requires 2FA?', res.data.requires2FA);

    console.log('--- Testing Login with OTP ---');
    const newOtp = speakeasy.totp({
      secret: twoFASecret,
      encoding: 'base32'
    });
    res = await fetchAPI('/login-2fa', 'POST', {
      email: email,
      token: newOtp
    });
    console.log('Final Login Success:', !!res.data.token);

    console.log('--- Testing Forgot Password ---');
    res = await fetchAPI('/forgot-password', 'POST', { email: email });
    console.log('Forgot Password Email Sent:', res.data.success);

    console.log('\nALL TESTS PASSED!');
  } catch (err) {
    console.error('TEST FAILED:', err.response ? err.response.data : err.message);
  }
}

testFlow();
