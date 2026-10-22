const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const PaymentSession = require('../models/PaymentSession');
const Transaction = require('../models/Transaction');
const { generateAccessToken } = require('../utils/authSecurity');

async function runMockSignatureTest() {
    console.log('=== TEST: MOCK SIGNATURE TOP-UP FLOW ===');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'mock_sig_auto_' + Date.now() + '@example.com';
    const user = await User.create({
        name: 'Mock Auto User',
        email,
        password: 'Password123!',
        isVerified: true,
        walletBalance: 15
    });

    const initialBalance = user.walletBalance;
    console.log('User initial balance:', initialBalance, 'AZN');

    const token = generateAccessToken(user);

    // Step 1: Top-up 25 AZN
    console.log('Step 1: Requesting top-up 25 AZN...');
    const topUpRes = await fetch('http://localhost:5000/api/wallet/topup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            amount: 25,
            currency: 'AZN',
            idempotencyKey: 'test_topup_25_' + Date.now()
        })
    });

    if (!topUpRes.ok) {
        throw new Error(`Topup failed with status ${topUpRes.status}: ${await topUpRes.text()}`);
    }

    const topUpData = await topUpRes.json();
    const paymentId = topUpData.paymentId;
    console.log(`Top-up session created successfully: ${paymentId}`);

    // Step 2: Callback with mock-sandbox-signature
    console.log('Step 2: Sending callback with x-payment-signature: mock-sandbox-signature...');
    const cbRes = await fetch(`http://localhost:5000/api/wallet/payments/${encodeURIComponent(paymentId)}/callback`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-payment-signature': 'mock-sandbox-signature'
        },
        body: JSON.stringify({
            amount: 25,
            currency: 'AZN',
            status: 'paid',
            providerReference: 'MOCK_SANDBOX_' + Date.now(),
            packageId: ''
        })
    });

    const cbData = await cbRes.json();
    console.log(`Callback status: ${cbRes.status}, message: "${cbData.message}"`);

    if (cbRes.status !== 200) {
        throw new Error(`Expected 200, got ${cbRes.status}: ${JSON.stringify(cbData)}`);
    }

    if (cbData.message === 'Ödəniş imzası yanlışdır') {
        throw new Error('FAILED: Signature error still occurred!');
    }

    // Step 3: Verify balance
    console.log('Step 3: Verifying wallet balance via API...');
    const balRes = await fetch('http://localhost:5000/api/wallet/balance', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const balData = await balRes.json();
    console.log(`Final wallet balance: ${balData.walletBalance} AZN`);

    if (balData.walletBalance !== initialBalance + 25) {
        throw new Error(`Expected balance ${initialBalance + 25}, but got ${balData.walletBalance}`);
    }

    console.log(`✓ Balance correctly increased by 25 AZN (15 -> ${balData.walletBalance})`);
    console.log('✓ Error "Ödəniş imzası yanlışdır" eliminated completely');

    // Cleanup
    await User.deleteOne({ _id: user._id });
    await PaymentSession.deleteMany({ user: user._id });
    await Transaction.deleteMany({ user: user._id });
    await mongoose.disconnect();
    console.log('=== MOCK SIGNATURE TEST PASSED 100% ===');
}

runMockSignatureTest().catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
});
