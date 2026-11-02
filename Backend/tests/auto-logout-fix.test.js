const assert = require('assert');
const http = require('http');

const API_HOST = '127.0.0.1';
const API_PORT = 5000;

function request(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch(e) { parsed = data; }
                resolve({ status: res.status, statusCode: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

async function run() {
    console.log('=== RUNNING AUTO-LOGOUT & REFRESH TOKEN VERIFICATION ===');

    const testEmail = `autologout_test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    // 1. Register test user
    console.log('1. Registering user...');
    const regRes = await request({
        hostname: API_HOST,
        port: API_PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5500'
        }
    }, {
        email: testEmail,
        password: testPassword,
        name: 'AutoLogout',
        lastName: 'Tester',
        phone: '+994509999999'
    });

    console.log('Register response status:', regRes.statusCode);
    assert(regRes.statusCode === 201 || regRes.statusCode === 200, 'Register must succeed');

    const accessToken = regRes.body.accessToken || regRes.body.token;
    assert(accessToken, 'Access token must be returned');

    // Extract refreshToken cookie
    const cookies = regRes.headers['set-cookie'] || [];
    const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
    console.log('Refresh cookie present:', Boolean(refreshCookie));
    assert(refreshCookie, 'refreshToken cookie must be set on register/login');

    const cookieHeader = refreshCookie.split(';')[0]; // refreshToken=...

    // 2. Test /api/auth/refresh with the refreshToken cookie
    console.log('2. Testing /api/auth/refresh with cookie...');
    const refreshRes = await request({
        hostname: API_HOST,
        port: API_PORT,
        path: '/api/auth/refresh',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieHeader,
            'Origin': 'http://localhost:5500'
        }
    }, {});

    console.log('Refresh response status:', refreshRes.statusCode);
    assert.strictEqual(refreshRes.statusCode, 200, '/api/auth/refresh must return 200');
    assert(refreshRes.body.accessToken, 'New accessToken must be returned from refresh');
    console.log('✅ Token successfully refreshed!');

    const newAccessToken = refreshRes.body.accessToken;
    const newCookies = refreshRes.headers['set-cookie'] || [];
    const newRefreshCookie = newCookies.find(c => c.startsWith('refreshToken='));
    assert(newRefreshCookie, 'Rotated refreshToken cookie must be set');

    // 3. Test /api/notifications/unread-count with newAccessToken
    console.log('3. Testing /api/notifications/unread-count with new token...');
    const notifRes = await request({
        hostname: API_HOST,
        port: API_PORT,
        path: '/api/notifications/unread-count',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + newAccessToken,
            'Origin': 'http://localhost:5500'
        }
    });

    console.log('Notifications unread-count status:', notifRes.statusCode);
    assert.strictEqual(notifRes.statusCode, 200, 'Notifications unread count must return 200');
    console.log('✅ Notifications endpoint verified without 401 loop!');

    // 4. Test /api/ads?category=phone with newAccessToken
    console.log('4. Testing /api/ads?category=phone...');
    const adsRes = await request({
        hostname: API_HOST,
        port: API_PORT,
        path: '/api/ads?category=phone&limit=10',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + newAccessToken,
            'Origin': 'http://localhost:5500'
        }
    });

    console.log('Ads query status:', adsRes.statusCode);
    assert.strictEqual(adsRes.statusCode, 200, 'Ads query must return 200');
    console.log('✅ Ads query with token verified!');

    console.log('=== ALL BACKEND REFRESH TESTS PASSED SUCCESSFULLY! ===');
}

run().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
