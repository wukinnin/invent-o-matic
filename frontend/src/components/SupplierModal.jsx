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

const SupplierModal = ({ open, onClose, supplier, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone_number: '',
    address: '',
  });

  useEffect(() => {
    if (supplier) {
      setFormData(supplier);
    } else {
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone_number: '',
        address: '',
      });
    }
  }, [supplier, open]);

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
      aria-labelledby="supplier-modal-title"
    >
      <Box sx={style}>
        <Typography id="supplier-modal-title" variant="h6" component="h2">
          {supplier ? 'Edit Supplier' : 'Create New Supplier'}
        </Typography>
        <TextField margin="normal" required fullWidth label="Name" name="name" value={formData.name} onChange={handleChange} />
        <TextField margin="normal" fullWidth label="Contact Person" name="contact_person" value={formData.contact_person} onChange={handleChange} />
        <TextField margin="normal" required fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
        <TextField margin="normal" fullWidth label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleChange} />
        <TextField margin="normal" fullWidth label="Address" name="address" multiline rows={3} value={formData.address} onChange={handleChange} />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ ml: 1 }}>Save</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SupplierModal;
