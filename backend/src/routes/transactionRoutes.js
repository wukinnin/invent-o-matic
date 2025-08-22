const express = require('express');
const router = express.Router();
const { createTransaction } = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const { transactionValidationRules, validateRequest } = require('../middleware/validationMiddleware');

// @route   POST api/transactions
// @desc    Create a new transaction
// @access  Private (Requires create_transaction permission)
router.post('/', [authMiddleware, rbacMiddleware(['create_transaction']), transactionValidationRules(), validateRequest], createTransaction);

module.exports = router;