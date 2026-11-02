# Mobilim.az Master Test Plan

Comprehensive E2E, API, Payment Concurrency, and Security Test Plan for **Mobilim.az** release qualification.

---

## 1. Scope & Execution Rules

- **Target System**: Mobilim.az Marketplace (Frontend: Vanilla HTML5/CSS/JS @ port 5500, Backend: Node.js/Express API @ port 5000, In-Memory Mongo & Redis mock).
- **Safety Preconditions**:
  - **Strictly isolated test data**: Never test with real payment cards or real Payriff production credentials (`PAYMENT_PROVIDER=mock`).
  - **Zero production DB exposure**: All automated backend tests execute against ephemeral `mongodb-memory-server` instances.
  - **Email mocking**: Nodemailer is stubbed or redirected to virtual mock log outputs.
- **Tools**: Playwright (TypeScript) for E2E browser flows, Node.js assert/Mongoose test harnesses for concurrency & atomic transaction races.

---

## 2. Test Cases Matrix

| ID | User Story | Preconditions | Steps | Expected Result | Test Data | Priority | Risk | Automatable? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0-1** | As a user topping up my wallet, if a backend crash occurs after walletCredited but before balance increment, the recovery worker must credit my balance exactly once. | In-memory Mongo active, user created with 50 AZN. | 1. Create `PaymentSession` (20 AZN, status: 'processing').<br>2. Set timestamp >10 min ago.<br>3. Insert `Transaction` with `status: 'pending'`, `walletCredited: true`.<br>4. Trigger recovery worker `processStuckPendingTopups()`.<br>5. Trigger recovery worker a 2nd time. | Recovery worker finishes transaction, sets `status: 'completed'`, and user balance is exactly 70 AZN (never 90 AZN). Second run is completely idempotent. | User initial: 50 AZN, top-up: 20 AZN | **P0** | Double-credit on server restart | Yes (Backend atomic test) |
| **P0-2** | As a user requesting cash-out, 2 simultaneous requests exceeding my available balance must never cause a double-deduction or overdraft. | User exists with `walletBalance: 100`, `walletReservedBalance: 0`. | 1. Send 2 parallel cash-out requests of 100 AZN each via `Promise.all([cashOut(100), cashOut(100)])`.<br>2. Inspect HTTP responses and DB state. | Exactly 1 request succeeds (200 OK); 2nd request is rejected with 400 Insufficient Balance. User final balance is 0, reserved is 100. Never negative balance. | User balance: 100 AZN, Cash-out: 100 AZN | **P0** | Financial deficit / balance drain | Yes (Backend concurrent test) |
| **P0-3** | As a payment gateway callback receiver, receiving duplicate Payriff callbacks must increment user balance only once (idempotent replay). | User exists with 50 AZN, PaymentSession created for 50 AZN. | 1. Dispatch first approved callback payload with valid mock signature.<br>2. Verify balance reaches 100 AZN.<br>3. Dispatch identical callback a 2nd time. | First callback returns 200 OK; second callback returns 200 OK with `{idempotent: true, alreadyProcessed: true}`. User balance remains strictly 100 AZN. | PaymentId: `pay_cb_rep_<ts>`, Amount: 50 AZN | **P0** | Double-crediting via webhook retry | Yes (Backend & API test) |
| **P0-4** | As a payment processor, out-of-order callbacks (FAILED received before APPROVED) must override to completed, whereas late FAILED after SUCCESS must be ignored. | User exists with 50 AZN, PaymentSession created. | 1. Dispatch callback with status 'FAILED'.<br>2. Verify session marked failed.<br>3. Dispatch approved callback for same session.<br>4. In a separate session, complete successfully, then dispatch a late 'FAILED' callback. | Flow 1: Session overrides to completed and wallet is credited +50 AZN.<br>Flow 2: Late failure is ignored with `{ignoredLateFailure: true}` and balance stays intact. | PaymentId: `pay_ooo_<ts>`, Amount: 50 AZN | **P0** | Lost top-up funds or reversed valid payments | Yes (Backend atomic test) |
| **P0-5** | As a distributed backend across multiple PM2 workers, simultaneous callbacks received by two workers at the exact same millisecond must credit once. | User with 50 AZN, PaymentSession for 50 AZN. | 1. Spawn 2 parallel async workers invoking `handlePayriffCallback` concurrently using `Promise.all`.<br>2. Inspect response payloads and final user balance. | One worker performs the update; the other worker detects existing lock/status and returns idempotent success. Final balance is exactly 100 AZN (never 150 AZN). | Concurrency: 2 workers, Amount: 50 AZN | **P0** | High-concurrency race condition | Yes (Backend concurrent test) |
| **P0-6** | As a marketplace admin or customer support, concurrent refund operations on a transaction must credit the wallet only once. | Completed transaction with 30 AZN deposit exists. | 1. Launch 2 simultaneous atomic refund operations on the same transaction reference via `Promise.all`.<br>2. Verify wallet balance and transaction status. | Exactly one refund succeeds; the other is rejected or returned as already refunded. User balance increases by only 30 AZN. | Refund amount: 30 AZN | **P0** | Double refund loss | Yes (Backend atomic test) |
| **P1-1** | As a platform operator, rate limiting must be shared across all PM2 cluster workers via Redis, enforcing 429 Too Many Requests after 100 hits. | PM2 cluster / multi-worker setup with Redis store. | 1. Issue 100 rapid requests across worker instances.<br>2. Issue 101st request.<br>3. Verify response status code and retry header. | First 100 requests return HTTP 200/404; the 101st request returns HTTP 429 Too Many Requests across all cluster workers. | 105 rapid HTTP GETs to `/api/ads` | **P1** | DoS attack bypass via round-robin workers | Yes (Backend cluster test) |
| **P1-2** | As a security engineer, unauthenticated state and invalid CSRF tokens must fail closed, and DISABLE_RATE_LIMIT must be strictly blocked in production. | Node environment configured for production simulation. | 1. Send state-modifying POST request without CSRF cookie/header.<br>2. Send request with expired/tampered JWT.<br>3. Attempt to start server with `DISABLE_RATE_LIMIT=true` in `NODE_ENV=production`. | Missing CSRF returns 403 Forbidden; invalid JWT returns 401 Unauthorized; server startup throws fatal error blocking rate limit bypass in production. | Invalid tokens, CSRF headers | **P1** | Security breach / Auth bypass | Yes (Backend security suite) |
| **P1-3** | As a new registrant, if my randomly generated referral code collides (Mongo E11000 duplicate key), the system must retry with high entropy and register successfully. | User model with unique index on `referralCode`. | 1. Mock collision on first 2 generation attempts.<br>2. Register user.<br>3. Verify user is saved with an 8-byte (16 hex char) entropy referral code. | Registration catches E11000 silently, retries generation, and saves user without throwing an unhandled exception. | User email: `ref_col_<ts>@example.com` | **P1** | Registration failure for users | Yes (Backend unit/integration) |
| **P1-4** | As a marketplace user, reviews or ad comments containing malicious HTML/JS must render safely via `textContent` without executing script. | Ad details page loaded with mock review containing `<script>alert(1)</script><img src=x onerror=alert(2)>`. | 1. Inject payload into review comment data.<br>2. Render review card in DOM.<br>3. Check if script executes or HTML is interpreted. | Payload rendered strictly as plain text (`textContent`). No alert dialogues or unescaped DOM nodes created. | `<img src=x onerror="window.__xss=1">` | **P1** | Stored XSS / Session hijack | Yes (Playwright DOM test) |
| **P1-5** | As an unauthenticated guest, visiting the site must not trigger continuous 401 loops on `/api/notifications/unread-count`. | Unauthenticated guest browser context (Live Server / port 5500). | 1. Open `index.html` as guest.<br>2. Monitor network traffic for 5 seconds.<br>3. Verify `/api/notifications/unread-count` is NOT called, or returns cleanly without redirect loop. | `fetchUnreadCount` checks `!token` and aborts immediately. Zero 401 spam or console exception loops. | Guest session | **P1** | Network congestion & UI freeze | Yes (Playwright network test) |
| **P2-1** | As the product owner, the website must strictly display the new brand "Mobilim.az" with zero occurrences of legacy "mobil.az" in user-visible HTML. | All static HTML files in `Front end/`. | 1. Scan all 24 HTML templates for case-insensitive `mobil.az`.<br>2. Verify occurrences of `mobilim.az`. | 0 legacy `mobil.az` occurrences; `mobilim.az` present across all titles, headers, and footers. | Static HTML files | **P2** | Brand inconsistency | Yes (Playwright & static test) |
| **P2-2** | As a phone buyer, I can search for a model, apply category filters, toggle favorites, and navigate pagination on the catalogue page. | Frontend & Backend running locally. | 1. Navigate to `/phone.html?category=phone`.<br>2. Type "iPhone" into search box.<br>3. Toggle heart icon on first ad.<br>4. Check `localStorage` favorites update.<br>5. Click pagination next page. | Ads list updates according to filter; heart icon toggles active state; favorites persisted; pagination loads subsequent cards smoothly. | Search query: "iPhone" | **P2** | Core UX degradation | Yes (Playwright E2E) |
| **P2-3** | As an SRE, baseline smoke endpoints must return 200 OK with valid schemas. | Running backend on port 5000, frontend on port 5500. | 1. GET `/api/health` -> 200 OK.<br>2. GET `/api/health-detailed` -> 200 with `{workers, rateLimiterStore}`.<br>3. GET `/api/ads?category=phone` -> 200 with 19 ads.<br>4. GET `/Photo/phone1.jpg` -> 200 OK. | All 4 checks pass within <500ms response time. | Smoke endpoints | **P2** | Total service outage | Yes (Playwright API / curl) |

---

## 3. Manual-Only Test Boundary (Safety Isolation)

The following procedures are **strictly prohibited from automation** and must only be executed manually under dedicated staging environments:
1. **Real Payment Processing**: Real credit cards, real 3D-Secure SMS codes, or live Payriff production endpoints.
2. **Account Deletion / Hard DB Drops**: Live database purge or drop operations.
3. **Outbound Communications**: Sending transactional SMS or emails to real consumer phone numbers or email addresses.
4. **Production Database Mutation**: Any write operation targeting production MongoDB clusters.

---

## 4. Test Execution & Release Gate

1. **Gate 1: Syntax & Static Check** (`npm run check`)
2. **Gate 2: Security & Concurrency Regressions** (`npm run test:security`)
3. **Gate 3: Playwright E2E Suite** (`npm run test:e2e`)
4. **Gate 4: Pre-release Smoke Sweep** (`P2-3 smoke verification`)

All gates must return Exit Code 0 prior to tagging a release candidate.
