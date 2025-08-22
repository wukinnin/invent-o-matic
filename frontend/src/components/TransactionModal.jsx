import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Modal, Box, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { AuthContext } from '../context/AuthContext'; // Assuming AuthContext provides token and user info

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

const TransactionModal = ({ open, onClose, onTransactionSuccess }) => {
  const { token, user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    item_id: '',
    type: 'INBOUND',
    quantity: '',
    reference_number: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setError('');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const body = { ...formData, user_id: user.id };

      await axios.post('http://localhost:5000/api/transactions', body, config);
      
      onTransactionSuccess(); // Callback to refresh data on the parent page
      onClose(); // Close the modal
    } catch (err) {
      console.error('Transaction failed:', err);
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="transaction-modal-title"
    >
      <Box sx={style}>
        <Typography id="transaction-modal-title" variant="h6" component="h2">
          Create New Transaction
        </Typography>
        <TextField margin="normal" required fullWidth label="Inventory Item ID" name="item_id" type="number" value={formData.item_id} onChange={handleChange} />
        <FormControl fullWidth margin="normal">
          <InputLabel id="type-select-label">Type</InputLabel>
          <Select
            labelId="type-select-label"
            value={formData.type}
            label="Type"
            name="type"
            onChange={handleChange}
          >
            <MenuItem value={'INBOUND'}>INBOUND</MenuItem>
            <MenuItem value={'OUTBOUND'}>OUTBOUND</MenuItem>
          </Select>
        </FormControl>
        <TextField margin="normal" required fullWidth label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} />
        <TextField margin="normal" fullWidth label="Reference Number" name="reference_number" value={formData.reference_number} onChange={handleChange} />
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ ml: 1 }}>Save Transaction</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default TransactionModal;
