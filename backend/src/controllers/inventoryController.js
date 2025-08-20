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

module.exports = { getAllItems };
