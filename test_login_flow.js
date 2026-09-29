const { chromium } = require('playwright');
const mongoose = require('./Backend/node_modules/mongoose');
const crypto = require('crypto');
const path = require('path');

(async () => {
  console.log('[*] Connecting to MongoDB...');
  await mongoose.connect('mongodb://127.0.0.1:27017/airyphone_db');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  // Intercept network requests to log them
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`[NETWORK] REQUEST: ${request.method()} ${request.url()}`);
      const headers = request.headers();
      console.log(`          Headers: Authorization: ${headers['authorization'] || 'NONE'}`);
      if (request.postData()) {
         console.log(`          Body: ${request.postData()}`);
      }
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      console.log(`[NETWORK] RESPONSE: ${response.status()} ${response.url()}`);
      try {
          const body = await response.text();
          console.log(`          Body: ${body}`);
      } catch (e) {}
    }
  });

  const filePath = 'file:///' + path.resolve(__dirname, 'Front end/login.html').replace(/\\/g, '/');
  console.log('[*] Navigating to:', filePath);
  await page.goto(filePath);

  console.log('[*] Filling credentials...');
  await page.fill('#loginIdentifier', 'mobil@gmail.com');
  await page.fill('#loginPassword', 'Mobil.az!1921021418');
  await page.click('#passwordLoginBtn');

  console.log('[*] Waiting for backend to create OTP...');
  await page.waitForTimeout(2000); // Wait for the first request to finish
  
  console.log('[*] Changing OTP hash in DB to 123456...');
  const Otp = require('./Backend/models/Otp');
  const codeHash = crypto.createHash('sha256').update('123456').digest('hex');
  await Otp.updateOne({ identifier: 'mobil@gmail.com' }, { codeHash });

  console.log('[*] Filling OTP...');
  await page.fill('#twoFactorCode', '123456');
  await page.click('#twoFactorVerifyBtn');

  console.log('[*] Waiting for navigation to admin.html...');
  await page.waitForNavigation({ url: /admin\.html/ });

  console.log('[*] Navigated to admin.html. Checking state...');
  
  const state = await page.evaluate(() => {
    const s_token = sessionStorage.getItem('token');
    const s_adminToken = sessionStorage.getItem('adminToken');
    const l_token = localStorage.getItem('token');
    const l_adminToken = localStorage.getItem('adminToken');
    const l_user = localStorage.getItem('user');
    const getAuthTokenRet = window.getAuthToken ? window.getAuthToken() : 'FUNCTION NOT FOUND';
    
    return { s_token, s_adminToken, l_token, l_adminToken, l_user, getAuthTokenRet };
  });

  console.log('\n--- BROWSER STATE IN admin.html ---');
  console.log('sessionStorage.getItem("token"):', state.s_token);
  console.log('sessionStorage.getItem("adminToken"):', state.s_adminToken);
  console.log('localStorage.getItem("token"):', state.l_token);
  console.log('localStorage.getItem("adminToken"):', state.l_adminToken);
  console.log('localStorage.getItem("user"):', state.l_user ? 'EXISTS (length ' + state.l_user.length + ')' : 'null');
  console.log('window.getAuthToken() returns:', state.getAuthTokenRet);
  console.log('-----------------------------------\n');

  // Let admin.js attempt its verify request
  await page.waitForTimeout(2000);

  await browser.close();
  await mongoose.disconnect();
})();
