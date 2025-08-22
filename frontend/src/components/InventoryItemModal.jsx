import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const InventoryItemModal = ({ open, onClose, item, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    category: '',
    min_stock_threshold: '',
    supplier_id: '',
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        name: '',
        description: '',
        quantity: '',
        category: '',
        min_stock_threshold: '',
        supplier_id: '',
      });
    }
  }, [item, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="inventory-item-modal-title"
    >
      <Box sx={style}>
        <Typography id="inventory-item-modal-title" variant="h6" component="h2">
          {item ? 'Edit Inventory Item' : 'Create New Inventory Item'}
        </Typography>
        <TextField margin="normal" required fullWidth label="Name" name="name" value={formData.name} onChange={handleChange} />
        <TextField margin="normal" fullWidth label="Description" name="description" value={formData.description} onChange={handleChange} />
        <TextField margin="normal" required fullWidth label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} />
        <TextField margin="normal" fullWidth label="Category" name="category" value={formData.category} onChange={handleChange} />
        <TextField margin="normal" required fullWidth label="Min Stock Threshold" name="min_stock_threshold" type="number" value={formData.min_stock_threshold} onChange={handleChange} />
        <TextField margin="normal" required fullWidth label="Supplier ID" name="supplier_id" type="number" value={formData.supplier_id} onChange={handleChange} />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ ml: 1 }}>Save</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default InventoryItemModal;
