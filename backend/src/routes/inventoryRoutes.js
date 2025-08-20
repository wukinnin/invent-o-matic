const express = require('express');
const router = express.Router();
const { getAllItems } = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET api/inventory
// @desc    Get all inventory items
// @access  Private (Requires login)
router.get('/', authMiddleware, getAllItems);

module.exports = router;
