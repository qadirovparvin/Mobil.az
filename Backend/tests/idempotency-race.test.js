require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const assert = require('assert');
const User = require('../models/User');
const PaymentSession = require('../models/PaymentSession');
const Package = require('../models/Package');
const { topUp, createPackagePaymentSession } = require('../controllers/walletController');

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

    // 1. Setup test user
    const testUser = await User.create({
        name: 'IdempRace',
        lastName: 'User',
        email: 'idemp_race_' + Date.now() + '@example.com',
        password: 'password123',
        walletBalance: 0
    });

    let testPkg = await Package.findOne({ active: true });
    let createdPkg = false;
    if (!testPkg) {
        testPkg = await Package.create({
            name: 'VIP Test Package',
            code: 'VIP',
            productId: 'vip_30d_' + Date.now(),
            priceAmount: 15,
            currency: 'AZN',
            durationDays: 30,
            active: true
        });
        createdPkg = true;
    }

    try {
        console.log('--- TEST 1: Two Parallel topUp Requests With Same IdempotencyKey ---');
        const idempotencyKey = 'topup_idemp_' + Date.now();
        const makeTopUpReq = () => ({
            user: testUser,
            body: {
                amount: 25,
                currency: 'AZN',
                idempotencyKey
            },
            get: (h) => (h.toLowerCase() === 'idempotency-key' ? idempotencyKey : '')
        });

        const res1 = createMockRes();
        const res2 = createMockRes();
        let err1 = null;
        let err2 = null;

        await Promise.all([
            topUp(makeTopUpReq(), res1, (e) => { err1 = e; }),
            topUp(makeTopUpReq(), res2, (e) => { err2 = e; })
        ]);

        console.log('TopUp 1 response:', res1.statusCode, 'idempotent:', res1.payload?.idempotent, 'err1:', err1);
        console.log('TopUp 2 response:', res2.statusCode, 'idempotent:', res2.payload?.idempotent, 'err2:', err2);

        assert(!err1, 'Request 1 must not produce an unhandled error');
        assert(!err2, 'Request 2 must not produce an unhandled error');

        const codes = [res1.statusCode, res2.statusCode].sort();
        // One must be 202 (created) and the other 200 (existing) or both valid 200/202
        assert(codes.includes(200) || codes.includes(202), 'Both responses must succeed');

        // Check idempotency flags: exactly one must be idempotent: true (or second is idempotent: true)
        const idempotents = [Boolean(res1.payload?.idempotent), Boolean(res2.payload?.idempotent)];
        console.log('Idempotent flags in parallel calls:', idempotents);
        assert(idempotents.includes(true), 'At least one response must have idempotent: true');
        assert(idempotents.includes(false), 'One response must have idempotent: false');

        // Both responses must return the same paymentId
        const pid1 = res1.payload?.paymentId || res1.payload?.payment?.paymentId;
        const pid2 = res2.payload?.paymentId || res2.payload?.payment?.paymentId;
        console.log('Payment IDs:', pid1, pid2);
        assert.strictEqual(pid1, pid2, 'Both parallel requests must point to the identical paymentId');

        // Verify only 1 session exists in database
        const sessions = await PaymentSession.find({ user: testUser._id, idempotencyKey });
        console.log('Number of payment sessions in DB:', sessions.length);
        assert.strictEqual(sessions.length, 1, 'Exactly 1 PaymentSession must be created');

        console.log('--- TEST 2: Sequential topUp Call with Same IdempotencyKey ---');
        const res3 = createMockRes();
        let err3 = null;
        await topUp(makeTopUpReq(), res3, (e) => { err3 = e; });
        console.log('Sequential response status:', res3.statusCode, 'idempotent:', res3.payload?.idempotent);
        assert(!err3, 'Sequential request must not produce error');
        assert.strictEqual(res3.statusCode, 200);
        assert.strictEqual(res3.payload?.idempotent, true, 'Sequential request must have idempotent: true');

        console.log('--- TEST 3: Parallel createPackagePaymentSession Requests With Same IdempotencyKey ---');
        const pkgIdempKey = 'pkg_idemp_' + Date.now();
        const makePkgReq = () => ({
            user: testUser,
            body: {
                packageId: testPkg.productId,
                provider: 'card',
                idempotencyKey: pkgIdempKey
            },
            get: (h) => (h.toLowerCase() === 'idempotency-key' ? pkgIdempKey : '')
        });

        const resPkg1 = createMockRes();
        const resPkg2 = createMockRes();
        let errPkg1 = null;
        let errPkg2 = null;

        await Promise.all([
            createPackagePaymentSession(makePkgReq(), resPkg1, (e) => { errPkg1 = e; }),
            createPackagePaymentSession(makePkgReq(), resPkg2, (e) => { errPkg2 = e; })
        ]);

        console.log('PackageSession 1:', resPkg1.statusCode, 'idempotent:', resPkg1.payload?.idempotent, 'err:', errPkg1);
        console.log('PackageSession 2:', resPkg2.statusCode, 'idempotent:', resPkg2.payload?.idempotent, 'err:', errPkg2);

        assert(!errPkg1, 'Package req 1 must succeed without error');
        assert(!errPkg2, 'Package req 2 must succeed without error');

        const pkgIdempotents = [Boolean(resPkg1.payload?.idempotent), Boolean(resPkg2.payload?.idempotent)];
        console.log('Package idempotent flags:', pkgIdempotents);
        assert(pkgIdempotents.includes(true), 'At least one package session must report idempotent: true');
        assert(pkgIdempotents.includes(false), 'One package session must report idempotent: false');

        const pkgPid1 = resPkg1.payload?.paymentId || resPkg1.payload?.payment?.paymentId;
        const pkgPid2 = resPkg2.payload?.paymentId || resPkg2.payload?.payment?.paymentId;
        assert.strictEqual(pkgPid1, pkgPid2, 'Both package sessions must return the same paymentId');

        const pkgSessions = await PaymentSession.find({ user: testUser._id, idempotencyKey: pkgIdempKey });
        assert.strictEqual(pkgSessions.length, 1, 'Exactly 1 PaymentSession must exist for package');

        console.log('=== ALL IDEMPOTENCY RACE TESTS PASSED 100%! ===');
    } finally {
        await User.deleteOne({ _id: testUser._id });
        if (createdPkg) {
            await Package.deleteOne({ _id: testPkg._id });
        }
        await PaymentSession.deleteMany({ user: testUser._id });
        await mongoose.disconnect();
    }
}

runTest().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
