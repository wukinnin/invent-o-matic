const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const inventoryValidationRules = () => {
  return [
    body('name').notEmpty().withMessage('Name is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('min_stock_threshold').isInt({ min: 0 }).withMessage('Minimum stock threshold must be a non-negative integer'),
    body('supplier_id').isInt({ min: 1 }).withMessage('Supplier ID must be a positive integer'),
  ];
};

const supplierValidationRules = () => {
  return [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Must be a valid email address'),
  ];
};

const transactionValidationRules = () => {
  return [
    body('item_id').isInt({ min: 1 }).withMessage('Item ID must be a positive integer'),
    body('user_id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
    body('type').isIn(['INBOUND', 'OUTBOUND']).withMessage('Type must be either INBOUND or OUTBOUND'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  ];
};

module.exports = { 
  validateRequest,
  inventoryValidationRules,
  supplierValidationRules,
  transactionValidationRules
};