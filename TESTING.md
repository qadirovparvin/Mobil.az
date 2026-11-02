# Mobilim.az Testing Guide

Comprehensive testing documentation for **Mobilim.az** (formerly Mobil.az).

---

## 1. Local Environment Setup

### 1.1 Backend API (Node.js / Express / MongoDB / Redis)
- **Directory**: `Backend/`
- **Default Port**: `5000` (`http://localhost:5000` or `http://127.0.0.1:5000`)
- **Node Version**: `>= 18.x`
- **Environment**: Configured via `Backend/.env` (sample template at `Backend/.env.example`)

#### Start Commands:
```powershell
# Check if backend is already running on port 5000:
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

# Ensure / Start backend daemon:
node Backend/ensure_backend.js

# Or start directly in foreground (development mode):
cd Backend
npm run dev     # with nodemon
# or:
npm start       # node server.js
```

### 1.2 Frontend (Vanilla HTML5 / Modern CSS / JavaScript)
- **Directory**: `Front end/`
- **Default Port**: `5500` (`http://127.0.0.1:5500` or `http://localhost:5500`)
- **API Target**: Centralized in `Front end/JS/config.js` (`http://localhost:5000/api`)

#### Start Commands:
```powershell
# Option A: Using Live Server (VS Code extension on port 5500)
# Option B: Using http-server / npx serve (recommended for automated CI/local testing):
npx http-server "Front end" -p 5500 -c-1 --cors
```

---

## 2. Smoke Checks

Quick health and availability verification:

```powershell
# 1. Health check (liveness)
curl.exe -s http://localhost:5000/api/health
# Expected: {"status":"ok","uptime":...}

# 2. Detailed health check (Redis, workers, rateLimiterStore)
curl.exe -s http://localhost:5000/api/health-detailed
# Expected: {"redis":"...","rateLimiterStore":"...","workers":...,"uptime":...}

# 3. Ads catalogue smoke test
node -e "fetch('http://localhost:5000/api/ads?category=phone').then(r => r.json()).then(d => console.log('Ads returned:', Array.isArray(d) ? d.length : (d.ads?.length || d.total)))"
# Expected: 19 ads returned

# 4. Static asset check
curl.exe -s -I http://127.0.0.1:5500/Photo/phone1.jpg
# Expected: HTTP 200 OK
```

---

## 3. Existing Security & Payment Regression Test Suite

All existing tests in `Backend/tests/` use `setupTestDB.js` with `MongoMemoryServer` (`mongodb-memory-server`) to guarantee that **tests never touch production or live databases**.

### 3.1 Running Individual Core Test Suites:
```powershell
# Payment & Callback Replay (Idempotency, Out-of-order, 2-worker race)
node Backend/tests/payriff-callback-replay.test.js

# Payment Crash Recovery (Crash between walletCredited and balance inc)
node Backend/tests/payment-double-inc-crash.test.js

# Cash-out Double Deduction & Concurrency
node Backend/tests/cashout-double-deduction.test.js

# Cash-out Rollback on Provider Failure
node Backend/tests/cashout-rollback.test.js

# Referral Code Entropy & Collision Recovery (E11000)
node Backend/tests/referral-entropy.test.js
node Backend/tests/referral-collision.test.js

# Rate Limiter Clustering & Redis Synchronization
node Backend/tests/rate-limiter-cluster.test.js
node Backend/tests/rate-limiter-redis.test.js

# Security & Regression Suite (Auth, CSRF, JWT, sanitize, XSS)
node Backend/tests/security-regression.test.js
node Backend/tests/xss-prevention.test.js
```

### 3.2 Running Syntax & Security Checks:
```powershell
# Syntax validation of critical controllers and server
npm run check

# Full security regression suite
npm run test:security
```

---

## 4. Coverage Strategy & Priority Matrix

| Priority | Test Suite | Description | Safety & Mocking |
| :--- | :--- | :--- | :--- |
| **P0** | **Payment Double-Inc Crash** | Crash simulated after `walletCredited: true` before balance update; recovery worker must credit exactly once. | `PAYMENT_PROVIDER=mock`, in-memory DB |
| **P0** | **Cash-Out Race** | 2 concurrent cashout requests with insufficient balance for both; exactly 1 must succeed. | In-memory DB, atomic Mongoose transactions |
| **P0** | **Payriff Callback Replay** | Identical callback delivered 2+ times; balance must increment only once (idempotent). | Mock webhook signatures, in-memory DB |
| **P0** | **Payriff Out-of-Order** | FAILED followed by APPROVED callback overrides to completed; SUCCESS followed by FAILED is ignored. | Mock signatures, state transition checks |
| **P0** | **2-Worker Race** | `Promise.all([callback(), callback()])` simulating cluster race condition; balance credited 1x. | Concurrency simulation |
| **P0** | **Refund Idempotency** | Concurrent refund requests for the same transaction credit wallet only once. | Transaction locks |
| **P1** | **Redis Rate Limiter Cluster**| 100 requests pass, 101st returns 429 across all cluster worker instances. | Redis mock / local instance |
| **P1** | **Auth & CSRF Fail-Closed** | Missing CSRF / invalid JWT fails closed; `DISABLE_RATE_LIMIT` blocked in production. | In-memory server |
| **P1** | **Referral Code Collision** | Duplicate key error (E11000) caught during user registration and retried with high entropy. | In-memory DB |
| **P1** | **XSS Sanitation** | Ad details, comments, and review cards use `textContent` rather than `innerHTML`. | DOM security checks |
| **P1** | **Guest Guard** | Notifications unread count does not trigger 401 redirect loops for guests. | Live Server E2E |
| **P2** | **Brand Consistency** | Zero occurrences of legacy `mobil.az` in user-facing HTML, replaced with `mobilim.az`. | Static inspection & E2E |
| **P2** | **Catalogue E2E** | Phone browsing, category filtering, search, pagination, and favorites toggle. | Playwright Chromium |
| **P2** | **Smoke Verification** | Continuous pinging of health, detailed health, ads, and static media endpoints. | Automated pipeline |

---

## 5. End-to-End (E2E) Testing with Playwright

Playwright is configured for browser testing of the UI flows at `tests/e2e/`.

### Run Playwright Tests:
```powershell
# Run all E2E tests headless:
npm run test:e2e

# Run with interactive UI:
npm run test:e2e:ui

# Run in headed browser (visible):
npm run test:e2e:headed

# Run full pre-release qualification (Syntax + Security + E2E):
npm run test:all
```
