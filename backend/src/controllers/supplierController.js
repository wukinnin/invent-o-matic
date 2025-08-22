const pool = require('../database/db');

const getAllSuppliers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers');
    res.json(rows);
  } catch (error) {
    console.error('Get all suppliers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Get supplier by id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createSupplier = async (req, res) => {
  try {
    const { name, contact_person, email, phone_number, address } = req.body;
    const [result] = await pool.query(
      'INSERT INTO suppliers (name, contact_person, email, phone_number, address) VALUES (?, ?, ?, ?, ?)',
      [name, contact_person, email, phone_number, address]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, email, phone_number, address } = req.body;
    await pool.query(
      'UPDATE suppliers SET name = ?, contact_person = ?, email = ?, phone_number = ?, address = ? WHERE id = ?',
      [name, contact_person, email, phone_number, address, id]
    );
    res.json({ id, ...req.body });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier };