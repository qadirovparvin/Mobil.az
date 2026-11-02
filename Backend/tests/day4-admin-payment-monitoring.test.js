require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const PaymentSession = require('../models/PaymentSession');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const adminController = require('../controllers/adminController');

function createMockRes() {
    const obj = {
        statusCode: 200,
        payload: null,
        status(code) {
            obj.statusCode = code;
            return obj;
        },
        json(data) {
            obj.payload = data;
            return obj;
        }
    };
    return obj;
}

async function runTest() {
    console.log('--- TEST 1: SMS_DEV_MODE production check & .env.example ---');
    // Check .env.example
    const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
    assert(envExample.includes('SMS_DEV_MODE=false'), '.env.example must have SMS_DEV_MODE=false');

    // Check auth-otp.js in production
    const authOtpJs = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'JS', 'auth-otp.js'), 'utf8');
    assert(authOtpJs.includes("process.env?.NODE_ENV === 'production'"), 'auth-otp.js must check for production environment');
    assert(authOtpJs.includes('SMS_DEV_MODE = false'), 'auth-otp.js must set SMS_DEV_MODE = false in production');

    // Test execution with NODE_ENV = 'production' via VM sandbox
    const vm = require('vm');
    const sandboxProd = {
        process: { env: { NODE_ENV: 'production' } },
        window: { location: { hostname: 'mobilim.az' } },
        document: { addEventListener: () => {}, getElementById: () => null },
        localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
        sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    };
    vm.createContext(sandboxProd);
    vm.runInContext(authOtpJs, sandboxProd);
    assert.strictEqual(sandboxProd.window.SMS_DEV_MODE, false, 'SMS_DEV_MODE must be false in production');

    // Test dev environment
    const sandboxDev = {
        process: { env: { NODE_ENV: 'development' } },
        window: { location: { hostname: 'localhost' } },
        document: { addEventListener: () => {}, getElementById: () => null },
        localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
        sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    };
    vm.createContext(sandboxDev);
    vm.runInContext(authOtpJs, sandboxDev);
    assert.strictEqual(sandboxDev.window.SMS_DEV_MODE, true, 'SMS_DEV_MODE must be true in dev');
    console.log('✓ TEST 1 passed: SMS_DEV_MODE is strictly false in production and true in dev!');

    console.log('--- TEST 2: cabinet.js idempotency key retry & history pagination ---');
    const cabinetJs = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'JS', 'cabinet.js'), 'utf8');
    assert(cabinetJs.includes('getIdempotencyKey'), 'cabinet.js must contain getIdempotencyKey');
    assert(cabinetJs.includes('currentPaymentAttemptKey'), 'cabinet.js must track currentPaymentAttemptKey');
    assert(cabinetJs.includes('submitBtn.disabled = true'), 'submitBtn must be disabled for single-flight');
    assert(cabinetJs.includes('currentTxPage'), 'cabinet.js must track currentTxPage');
    assert(cabinetJs.includes('loadMoreTransactionsBtn'), 'cabinet.js must contain loadMoreTransactionsBtn');
    assert(cabinetJs.includes('wallet/transactions?page='), 'cabinet.js must fetch transactions with page param');
    console.log('✓ TEST 2 passed: cabinet.js idempotency key, single-flight & pagination verified!');

    console.log('--- TEST 3: Admin PaymentSession endpoint & reconcile ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminUser = await User.create({
        name: 'Admin',
        lastName: 'Monitor',
        email: 'admin_mon_' + Date.now() + '@example.com',
        password: 'password123',
        role: 'admin',
        isVerified: true
    });

    const regularUser = await User.create({
        name: 'Regular',
        lastName: 'Buyer',
        email: 'buyer_' + Date.now() + '@example.com',
        phone: '+99450' + Math.floor(1000000 + Math.random() * 9000000),
        password: 'password123',
        walletBalance: 50
    });

    try {
        const pPending = await PaymentSession.create({
            paymentId: 'pay_test_pending_' + Date.now(),
            user: regularUser._id,
            kind: 'wallet_topup',
            provider: 'payriff',
            expectedAmount: 20,
            currency: 'AZN',
            status: 'pending',
            providerOrderId: 'payriff_ord_test_pending',
            expiresAt: new Date(Date.now() + 600000)
        });

        const pCompleted = await PaymentSession.create({
            paymentId: 'pay_test_comp_' + Date.now(),
            user: regularUser._id,
            kind: 'wallet_topup',
            provider: 'payriff',
            expectedAmount: 35,
            currency: 'AZN',
            status: 'completed',
            providerOrderId: 'payriff_ord_test_comp',
            expiresAt: new Date(Date.now() + 600000)
        });

        // 3a. Admin get all payment sessions
        const req1 = {
            query: { limit: 10 },
            user: adminUser,
            path: '/payment-sessions'
        };
        const res1 = createMockRes();
        await adminController.getPaymentSessions(req1, res1, () => {});
        assert.strictEqual(res1.statusCode, 200);
        assert(Array.isArray(res1.payload.sessions), 'Response must have sessions array');
        assert(res1.payload.total >= 2, 'Total must be at least 2');
        console.log('getPaymentSessions returned total:', res1.payload.total);

        // 3b. Admin get payment sessions with status=pending
        const req2 = {
            query: { status: 'pending' },
            user: adminUser,
            path: '/payment-sessions'
        };
        const res2 = createMockRes();
        await adminController.getPaymentSessions(req2, res2, () => {});
        assert.strictEqual(res2.statusCode, 200);
        assert(res2.payload.sessions.every(s => s.status === 'pending'), 'All sessions must have status pending');
        console.log('getPaymentSessions?status=pending returned pending count:', res2.payload.sessions.length);

        // 3c. Admin getPendingPayments alias
        const req3 = {
            query: {},
            user: adminUser,
            path: '/payment-sessions/pending'
        };
        const res3 = createMockRes();
        await adminController.getPendingPayments(req3, res3, () => {});
        assert.strictEqual(res3.statusCode, 200);
        assert(res3.payload.sessions.every(s => s.status === 'pending'), 'getPendingPayments must only return pending sessions');
        console.log('getPendingPayments alias passed!');

        // 3d. Reconcile endpoint
        const req4 = {
            params: { id: pPending._id.toString() },
            user: adminUser
        };
        const res4 = createMockRes();
        await adminController.reconcileSingleSession(req4, res4, () => {});
        assert.strictEqual(res4.statusCode, 200);
        assert(typeof res4.payload.reconciled === 'boolean');
        console.log('reconcileSingleSession result:', res4.payload);

        // Verify audit log was recorded
        const audit = await AuditLog.findOne({ target: pPending._id });
        assert(audit, 'AuditLog must be created for reconcile action');
        console.log('Audit log verified action:', audit.action);

        // 3e. Reconcile endpoint when approved
        const payriffProvider = require('../services/payriffProvider');
        const origGetStatus = payriffProvider.getOrderStatus;
        payriffProvider.getOrderStatus = async () => ({ status: 'APPROVED' });

        const res5 = createMockRes();
        await adminController.reconcileSingleSession(req4, res5, () => {});
        payriffProvider.getOrderStatus = origGetStatus;

        assert.strictEqual(res5.statusCode, 200);
        assert.strictEqual(res5.payload.reconciled, true);
        assert.strictEqual(res5.payload.status, 'completed');
        console.log('reconcileSingleSession approved flow passed!');

        const updatedSession = await PaymentSession.findById(pPending._id);
        assert.strictEqual(updatedSession.status, 'completed');

        const auditApproved = await AuditLog.findOne({ target: pPending._id, action: 'reconcile_payment' });
        assert(auditApproved, 'AuditLog must be created for reconcile_payment action');
        console.log('Audit log approved action verified:', auditApproved.action);

        console.log('\n=== ALL DAY4-P1-SMS-BYPASS-ADMIN-PAYMENT-MONITORING TESTS PASSED 100%! ===');
    } finally {
        await User.deleteMany({ _id: { $in: [adminUser._id, regularUser._id] } });
        await PaymentSession.deleteMany({ user: regularUser._id });
        await Transaction.deleteMany({ user: regularUser._id });
        await AuditLog.deleteMany({ actor: adminUser._id });
        await mongoose.disconnect();
    }
}

runTest().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
