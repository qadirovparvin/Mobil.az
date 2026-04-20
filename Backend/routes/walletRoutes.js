const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getBalance, topUp, getTransactions } = require('../controllers/walletController');

router.use(protect);  // All wallet routes are private

router.get('/balance',      getBalance);
router.post('/topup',       topUp);
router.get('/transactions', getTransactions);

module.exports = router;
