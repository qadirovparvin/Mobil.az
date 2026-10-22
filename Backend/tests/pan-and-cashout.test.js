require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const assert = require('assert');
const User = require('../models/User');
const CashOutRequest = require('../models/CashOutRequest');
const Transaction = require('../models/Transaction');
const { requestCashOut, adminReviewCashOut } = require('../controllers/walletController');

function createMockRes() {
    const obj = {
        statusCode: 200,
        payload: null,
        status(c) { obj.statusCode = c; return obj; },
        json(d) { obj.payload = d; return obj; }
    };
    return obj;
}

async function runTest() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Setup test user
    const testUser = await User.create({
        name: 'PanTest',
        lastName: 'User',
        email: 'pan_test_' + Date.now() + '@example.com',
        password: 'password123',
        walletBalance: 100,
        walletReservedBalance: 0
    });

    const adminUser = await User.create({
        name: 'Admin',
        lastName: 'User',
        email: 'admin_test_' + Date.now() + '@example.com',
        password: 'password123',
        role: 'admin'
    });

    try {
        console.log('--- TEST 1: PAN Filter (Hyphens, Spaces, Direct) ---');
        // 1.1 Hyphenated card in requestCashOut
        const reqHyphen = {
            user: testUser,
            body: {
                amount: 20,
                destination: 'card',
                accountHolderDetails: '1234-5678-9012-3456',
                idempotencyKey: 'idemp_pan_1_' + Date.now()
            },
            get: () => 'idemp_pan_1'
        };
        const resHyphen = createMockRes();
        await requestCashOut(reqHyphen, resHyphen, () => {});
        console.log('Hyphenated PAN response:', resHyphen.statusCode, resHyphen.payload);
        assert.strictEqual(resHyphen.statusCode, 400, 'Hyphenated card number must be rejected with 400');

        // 1.2 Spaced card in requestCashOut
        const reqSpace = {
            user: testUser,
            body: {
                amount: 20,
                destination: 'card',
                accountHolderDetails: '1234 5678 9012 3456',
                idempotencyKey: 'idemp_pan_2_' + Date.now()
            },
            get: () => 'idemp_pan_2'
        };
        const resSpace = createMockRes();
        await requestCashOut(reqSpace, resSpace, () => {});
        console.log('Spaced PAN response:', resSpace.statusCode, resSpace.payload);
        assert.strictEqual(resSpace.statusCode, 400, 'Spaced card number must be rejected with 400');

        // 1.3 Model schema validation on CashOutRequest
        const docHyphen = new CashOutRequest({
            user: testUser._id,
            amount: 20,
            destination: 'card',
            accountHolderDetails: '1234-5678-9012-3456',
            idempotencyKey: 'key_123'
        });
        let modelErr = null;
        try {
            await docHyphen.validate();
        } catch (err) {
            modelErr = err;
        }
        assert(modelErr, 'CashOutRequest model must reject hyphenated PAN');
        console.log('Model validation correctly rejected hyphenated PAN');

        console.log('--- TEST 2: Valid Cash-Out Creation ---');
        const reqValid = {
            user: testUser,
            body: {
                amount: 30,
                destination: 'card',
                accountHolderDetails: 'Recipient John Doe, token tok_card_valid',
                idempotencyKey: 'idemp_valid_' + Date.now()
            },
            get: () => 'idemp_valid_' + Date.now()
        };
        const resValid = createMockRes();
        await requestCashOut(reqValid, resValid, () => {});
        console.log('Valid cash-out response:', resValid.statusCode, resValid.payload?.message);
        assert.strictEqual(resValid.statusCode, 201, 'Valid cash-out must return 201');

        const cashOutId = resValid.payload.cashOut._id;
        const userAfterReq = await User.findById(testUser._id);
        assert.strictEqual(userAfterReq.walletBalance, 70, 'Available balance should be 70');
        assert.strictEqual(userAfterReq.walletReservedBalance, 30, 'Reserved balance should be 30');

        console.log('--- TEST 3: Admin Review to Processing & Reject Block ---');
        // Transition to processing
        const reqProcess = {
            params: { id: cashOutId },
            user: adminUser,
            body: { status: 'processing' }
        };
        const resProcess = createMockRes();
        let processErr = null;
        await adminReviewCashOut(reqProcess, resProcess, (err) => { processErr = err; });
        if (processErr) console.error('adminReviewCashOut processErr:', processErr);
        console.log('Review to processing response:', resProcess.statusCode, resProcess.payload?.cashOut?.status);
        assert.strictEqual(resProcess.statusCode, 200);
        assert.strictEqual(resProcess.payload.cashOut.status, 'processing');

        // Attempt to reject while in processing -> must be blocked
        const reqRejectWhileProcessing = {
            params: { id: cashOutId },
            user: adminUser,
            body: { status: 'rejected', rejectionReason: 'Test block' }
        };
        const resReject = createMockRes();
        let rejectedNextErr = null;
        await adminReviewCashOut(reqRejectWhileProcessing, resReject, (err) => { rejectedNextErr = err; });
        console.log('Reject while processing response:', resReject.statusCode, resReject.payload, rejectedNextErr?.payload || rejectedNextErr?.message);
        const errPayload = resReject.payload || rejectedNextErr?.payload;
        assert(
            resReject.statusCode === 400 || rejectedNextErr?.status === 400,
            'Reject while processing must return 400'
        );

        console.log('--- TEST 4: Balance Update Check & Final Paid ---');
        // Transition from processing to paid
        const reqPaid = {
            params: { id: cashOutId },
            user: adminUser,
            body: { status: 'paid' }
        };
        const resPaid = createMockRes();
        await adminReviewCashOut(reqPaid, resPaid, () => {});
        console.log('Paid response:', resPaid.statusCode, resPaid.payload?.cashOut?.status);
        assert.strictEqual(resPaid.statusCode, 200);
        assert.strictEqual(resPaid.payload.cashOut.status, 'paid');

        const userFinal = await User.findById(testUser._id);
        console.log('User final balance:', userFinal.walletBalance, 'reserved:', userFinal.walletReservedBalance);
        assert.strictEqual(userFinal.walletBalance, 70);
        console.log('--- TEST 5: Insufficient Reserved Balance Blocks Status Change ---');
        const reqValid2 = {
            user: testUser,
            body: {
                amount: 20,
                destination: 'card',
                accountHolderDetails: 'Recipient John Doe, token tok_card_valid2',
                idempotencyKey: 'idemp_valid2_' + Date.now()
            },
            get: () => 'idemp_valid2_' + Date.now()
        };
        const resValid2 = createMockRes();
        await requestCashOut(reqValid2, resValid2, () => {});
        assert.strictEqual(resValid2.statusCode, 201);
        const cashOutId2 = resValid2.payload.cashOut._id;

        // Artificially tamper with reserved balance to simulate race/deficiency
        await User.updateOne({ _id: testUser._id }, { $set: { walletReservedBalance: 0 } });

        const reqRejectTampered = {
            params: { id: cashOutId2 },
            user: adminUser,
            body: { status: 'rejected', rejectionReason: 'Should fail balance check' }
        };
        const resRejectTampered = createMockRes();
        let tamperedErr = null;
        await adminReviewCashOut(reqRejectTampered, resRejectTampered, (err) => { tamperedErr = err; });

        assert(
            resRejectTampered.statusCode === 400 || tamperedErr?.status === 400,
            'Must return 400 when balance update fails'
        );
        const cashOutDocAfter = await CashOutRequest.findById(cashOutId2);
        assert.strictEqual(cashOutDocAfter.status, 'pending', 'Status must NOT be updated when balance update fails');
        console.log('Balance update check passed: status remained pending on balance update failure');

        console.log('=== ALL PAN & CASHOUT TESTS PASSED 100%! ===');
    } finally {
        await User.deleteMany({ _id: { $in: [testUser._id, adminUser._id] } });
        await CashOutRequest.deleteMany({ user: testUser._id });
        await Transaction.deleteMany({ user: testUser._id });
        await mongoose.disconnect();
    }
}

runTest().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
