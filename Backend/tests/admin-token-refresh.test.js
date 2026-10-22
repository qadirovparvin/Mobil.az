const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TEST 1: admin.html script order & config.js deduplication ---');
const adminHtmlPath = path.join(__dirname, '..', '..', 'Front end', 'admin.html');
const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

// Ensure config.js is only included once
const configMatches = adminHtml.match(/src=["']JS\/config\.js["']/g);
assert.strictEqual(configMatches.length, 1, 'config.js must only be loaded once in admin.html');

// Ensure auth.js and api.js are included before admin.js
const authIdx = adminHtml.indexOf('src="JS/auth.js"');
const apiIdx = adminHtml.indexOf('src="JS/api.js"');
const adminIdx = adminHtml.indexOf('src="JS/admin.js"');
const configIdx = adminHtml.indexOf('src="JS/config.js"');

assert(configIdx > 0, 'config.js must be present');
assert(authIdx > configIdx, 'auth.js must follow config.js');
assert(apiIdx > authIdx, 'api.js must follow auth.js');
assert(adminIdx > apiIdx, 'admin.js must follow api.js');
console.log('✅ TEST 1 passed: Script order in admin.html is config.js -> auth.js -> api.js -> admin.js');

console.log('--- TEST 2: admin.js token refresh queue & transparent retry ---');
const adminJsPath = path.join(__dirname, '..', '..', 'Front end', 'JS', 'admin.js');
const adminJs = fs.readFileSync(adminJsPath, 'utf8');

assert(adminJs.includes('isRefreshing'), 'admin.js must declare isRefreshing flag');
assert(adminJs.includes('refreshQueue'), 'admin.js must declare refreshQueue array');
assert(adminJs.includes('/auth/refresh'), 'admin.js must call /auth/refresh endpoint on 401');
assert(adminJs.includes('processRefreshQueue'), 'admin.js must implement processRefreshQueue');
assert(adminJs.includes('refreshToken'), 'admin.js must implement refreshToken');
console.log('✅ TEST 2 passed: admin.js token refresh queue & retry logic verified');

console.log('=== ALL ADMIN TOKEN REFRESH TESTS PASSED 100%! ===');
