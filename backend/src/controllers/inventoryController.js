const pool = require('../database/db');

const getAllItems = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventory_items');
    res.json(rows);
  } catch (error) {
    console.error('Get all items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createItem = async (req, res) => {
  try {
    const { name, description, quantity, category, min_stock_threshold, supplier_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO inventory_items (name, description, quantity, category, min_stock_threshold, supplier_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, quantity, category, min_stock_threshold, supplier_id]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, category, min_stock_threshold, supplier_id } = req.body;
    await pool.query(
      'UPDATE inventory_items SET name = ?, description = ?, quantity = ?, category = ?, min_stock_threshold = ?, supplier_id = ? WHERE id = ?',
      [name, description, quantity, category, min_stock_threshold, supplier_id, id]
    );
    res.json({ id, ...req.body });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM inventory_items WHERE id = ?', [id]);
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getAllItems, createItem, updateItem, deleteItem };
