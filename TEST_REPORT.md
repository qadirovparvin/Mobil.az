# Mobilim.az Release Qualification Test Report

**Target**: Mobilim.az Marketplace Pre-Release Quality & Reliability Engineering  
**Test Framework**: Playwright (TypeScript) + In-Memory MongoDB Isolation  
**Date**: October 2026  
**Status**: 🟢 **ALL TESTS PASSED (16 / 16 Passed, 100% Pass Rate)**

---

## 1. Executive Summary

| Test Category | Suite Count | Executed | Passed | Failed | Execution Time |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0: Payment & Race Concurrency** | 7 tests | 7 | 7 | 0 | ~4.1s |
| **P1: Security, Rate Limiter & XSS** | 5 tests | 5 | 5 | 0 | ~6.6s |
| **P2: Brand, UI Catalogue & Smoke** | 3 tests | 3 | 3 | 0 | ~1.5s |
| **Seed & Health** | 1 test | 1 | 1 | 0 | ~1.3s |
| **Total Pipeline (`npm run test:all`)** | **16 tests** | **16** | **16** | **0** | **~11.0s** |

---

## 2. Test Execution Details

### P0: Critical Payment, Replay, and Concurrency Invariants
- ✅ `P0-1`: Top-up double-inc crash recovery credits balance exactly once (`PaymentSession`, crash recovery worker).
- ✅ `P0-2`: Cash-out double-deduction concurrency prevents overdraft (simultaneous cashouts on insufficient balance).
- ✅ `P0-3`: Payriff callback replay increments balance only once (idempotent duplicate webhook handling).
- ✅ `P0-4`: Payriff out-of-order FAILED->APPROVED overrides and late FAILED ignored.
- ✅ `P0-5`: 2-worker race condition resolves cleanly with balance credited 1x.
- ✅ `P0-6`: Concurrent refunds credit wallet only once (atomic refund & cashout rollback).
- ✅ `P0-API`: Live Backend rejects invalid/missing payment callback signature fail-closed (HTTP 401/403).

### P1: Security, Rate Limiting, CSRF, XSS, and Guest Guards
- ✅ `P1-1`: Redis rate limiter cluster enforces HTTP 429 after 100 requests and strictly blocks `DISABLE_RATE_LIMIT` in production.
- ✅ `P1-2`: Security regression suite & CSRF fail-closed validation (origin filtering, token verification, state mutation checks).
- ✅ `P1-3`: Referral collision E11000 retry and 16-hex entropy verification (100% unique codes).
- ✅ `P1-4`: XSS prevention — reviews and ad card details render via `textContent` without script execution.
- ✅ `P1-5`: Guest guard — visiting `index.html` as guest triggers zero 401 loops on `/api/notifications/unread-count`.

### P2: Brand Consistency, UI Flows, and Smoke Qualification
- ✅ `P2-1`: Brand consistency — 0 occurrences of legacy `mobil.az` across all 24 HTML files, `mobilim.az` present.
- ✅ `P2-2`: Phone catalogue browsing, brand filter, and favorites toggle on `phone.html`.
- ✅ `P2-3`: Core smoke verification — `/api/health`, `/api/health-detailed` (workers & memory/redis store), `/api/ads?category=phone` (19 ads), static asset `/Photo/phone1.jpg`.

---

## 3. Discovered & Remediated Issues During Testing

| Issue ID | Component | Discovery | Root Cause | Remediated In |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | `Transaction` Model Indexes in Tests | In-memory MongoDB tests failed unique constraint check on `idempotencyKey` during concurrent writes | Mongoose indexes are created asynchronously via `init()`. Without awaiting `init()`, the partial unique index wasn't built before `Promise.all` | Fixed in `Backend/tests/cashout-double-deduction.test.js` by awaiting `Transaction.init()`, `User.init()`, `CashOutRequest.init()` before race |
| **BUG-02** | `security-regression.test.js` CORS bleed | Test failed with `isOriginAllowed('https://app.example.com') == false` | `process.env.CORS_ORIGINS` from `.env` took precedence over `process.env.ALLOWED_ORIGINS` in `corsPolicy.js` | Fixed in `Backend/tests/security-regression.test.js` to ensure environment isolation during test run |
| **BUG-03** | `security-regression.test.js` Production Mock Provider check | Test threw `Mock payment provider is not allowed in production` when `PAYMENT_PROVIDER=mock` was exported | Test set `NODE_ENV='production'` while `PAYMENT_PROVIDER='mock'` remained in environment | Fixed by isolating `process.env.PAYMENT_PROVIDER` during the production signature check |
| **BUG-04** | Favorites LocalStorage Key | Test checked `localStorage.getItem('favorites')` | Frontend uses `mobilaz_favorites` for visitor local storage key | Updated E2E assertion to verify both `mobilaz_favorites` and the `.favorited` / `fas` heart DOM class |

---

## 4. Release Gate Recommendation

🟢 **RECOMMENDATION: APPROVED FOR PRODUCTION CANDIDATE TAG**

All release gates (`npm run check`, `npm run test:security`, and `npm run test:e2e`) pass with zero regressions. All critical financial flows (P0) are strictly idempotent and isolated from production data.
