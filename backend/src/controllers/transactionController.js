const pool = require('../database/db');

const createTransaction = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { item_id, user_id, type, quantity, reference_number } = req.body;

    await connection.beginTransaction();

    // 1. Get current quantity
    const [rows] = await connection.query('SELECT quantity FROM inventory_items WHERE id = ? FOR UPDATE', [item_id]);
    if (rows.length === 0) {
      throw new Error('Inventory item not found');
    }
    const currentQuantity = rows[0].quantity;

    // 2. Calculate new quantity and check for sufficient stock
    let newQuantity;
    if (type === 'OUTBOUND') {
      if (currentQuantity < quantity) {
        throw new Error('Insufficient stock');
      }
      newQuantity = currentQuantity - quantity;
    } else { // INBOUND
      newQuantity = currentQuantity + quantity;
    }

    // 3. Update inventory item quantity
    await connection.query('UPDATE inventory_items SET quantity = ? WHERE id = ?', [newQuantity, item_id]);

    // 4. Create transaction record
    await connection.query(
      'INSERT INTO transactions (item_id, user_id, type, quantity, reference_number) VALUES (?, ?, ?, ?, ?)',
      [item_id, user_id, type, quantity, reference_number]
    );

    await connection.commit();

    res.status(201).json({ message: 'Transaction created successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Create transaction error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  } finally {
    connection.release();
  }
};

module.exports = { createTransaction };