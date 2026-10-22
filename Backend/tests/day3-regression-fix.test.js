const assert = require('assert');
const fs = require('fs');
const path = require('path');
const payriffProvider = require('../services/payriffProvider');
const walletController = require('../controllers/walletController');
const paymentConfig = require('../config/payment');

async function testSuite() {
    console.log('--- TEST 1: payriffProvider.getOrderStatus null & undefined safety ---');
    // 1. null providerOrderId
    const nullResult = await payriffProvider.getOrderStatus(null);
    assert.strictEqual(nullResult, null, 'payriffProvider.getOrderStatus(null) must return null');

    // 2. undefined providerOrderId
    const undefinedResult = await payriffProvider.getOrderStatus(undefined);
    assert.strictEqual(undefinedResult, null, 'payriffProvider.getOrderStatus(undefined) must return null');

    // 3. empty string providerOrderId
    const emptyResult = await payriffProvider.getOrderStatus('');
    assert.strictEqual(emptyResult, null, 'payriffProvider.getOrderStatus("") must return null');

    // 4. config compatibility
    assert(paymentConfig.payriff, 'paymentConfig.payriff must exist');
    assert(paymentConfig.payment, 'paymentConfig.payment must exist');
    assert.strictEqual(paymentConfig.payment.payriff.baseUrl, paymentConfig.payriff.baseUrl);

    console.log('✓ TEST 1 passed: getOrderStatus safe against null and config access works!');

    console.log('--- TEST 2: cabinet.js catch block does not show false success toast ---');
    const cabinetJsPath = path.join(__dirname, '..', '..', 'Front end', 'JS', 'cabinet.js');
    const cabinetJs = fs.readFileSync(cabinetJsPath, 'utf8');

    assert(!cabinetJs.includes("toast.show('Ödəniş qeydə alındı.'"), 'Must NOT contain false success toast "Ödəniş qeydə alındı."');
    assert(cabinetJs.includes("Ödəniş statusu yoxlanıla bilmədi, cabinet-i yeniləyin"), 'Must show warning "Ödəniş statusu yoxlanıla bilmədi, cabinet-i yeniləyin" on fetch failure');
    console.log('✓ TEST 2 passed: cabinet.js error handling verified!');

    console.log('--- TEST 3: walletController exports completeTopUpPayment ---');
    assert(typeof walletController.completeTopUpPayment === 'function', 'walletController.completeTopUpPayment must be exported as a function');
    assert(typeof walletController._test?.completeTopUpPayment === 'function', 'walletController._test.completeTopUpPayment must exist');
    console.log('✓ TEST 3 passed: completeTopUpPayment export verified!');

    console.log('--- TEST 4: server.js reconciliation scheduler structure ---');
    const serverJsPath = path.join(__dirname, '..', 'server.js');
    const serverJs = fs.readFileSync(serverJsPath, 'utf8');

    const hasReconcile = serverJs.includes('reconcilePendingPayments') || serverJs.includes('reconcilePayments');
    assert(hasReconcile, 'server.js must contain reconciliation schedule call');
    console.log('✓ TEST 4 passed: server.js reconciliation scheduler structure verified!');

    console.log('\n=== ALL FIX-LAST-2-BUGS-DAY3 TESTS PASSED 100%! ===');
}

testSuite().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
