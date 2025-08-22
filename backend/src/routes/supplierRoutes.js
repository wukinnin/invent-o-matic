const express = require('express');
const router = express.Router();
const { 
  getAllSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} = require('../controllers/supplierController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// @route   GET api/suppliers
// @desc    Get all suppliers
// @access  Private (Requires login)
router.get('/', authMiddleware, getAllSuppliers);

// @route   GET api/suppliers/:id
// @desc    Get a supplier by ID
// @access  Private (Requires login)
router.get('/:id', authMiddleware, getSupplierById);

// @route   POST api/suppliers
// @desc    Create a supplier
// @access  Private (Requires manage_suppliers permission)
router.post('/', [authMiddleware, rbacMiddleware(['manage_suppliers'])], createSupplier);

// @route   PUT api/suppliers/:id
// @desc    Update a supplier
// @access  Private (Requires manage_suppliers permission)
router.put('/:id', [authMiddleware, rbacMiddleware(['manage_suppliers'])], updateSupplier);

// @route   DELETE api/suppliers/:id
// @desc    Delete a supplier
// @access  Private (Requires manage_suppliers permission)
router.delete('/:id', [authMiddleware, rbacMiddleware(['manage_suppliers'])], deleteSupplier);

module.exports = router;