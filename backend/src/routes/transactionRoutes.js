const express = require('express');
const router = express.Router();
const { createTransaction } = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// @route   POST api/transactions
// @desc    Create a new transaction
// @access  Private (Requires create_transaction permission)
router.post('/', [authMiddleware, rbacMiddleware(['create_transaction'])], createTransaction);

module.exports = router;