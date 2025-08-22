const express = require('express');
const router = express.Router();
const { getAllItems, createItem, updateItem, deleteItem } = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// @route   GET api/inventory
// @desc    Get all inventory items
// @access  Private (Requires login)
router.get('/', authMiddleware, getAllItems);

// @route   POST api/inventory
// @desc    Create an inventory item
// @access  Private (Requires manage_inventory permission)
router.post('/', [authMiddleware, rbacMiddleware(['manage_inventory'])], createItem);

// @route   PUT api/inventory/:id
// @desc    Update an inventory item
// @access  Private (Requires manage_inventory permission)
router.put('/:id', [authMiddleware, rbacMiddleware(['manage_inventory'])], updateItem);

// @route   DELETE api/inventory/:id
// @desc    Delete an inventory item
// @access  Private (Requires manage_inventory permission)
router.delete('/:id', [authMiddleware, rbacMiddleware(['manage_inventory'])], deleteItem);

module.exports = router;
