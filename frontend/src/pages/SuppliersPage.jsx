import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Box, Button, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { AuthContext } from '../context/AuthContext';
import SupplierModal from '../components/SupplierModal';

const SuppliersPage = () => {
  const { token, user } = useContext(AuthContext);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const canManageSuppliers = user?.permissions?.includes('manage_suppliers');

  const fetchSuppliers = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:5000/api/suppliers', config);
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchSuppliers();
    }
  }, [token]);

  const handleOpenModal = (supplier = null) => {
    setSelectedSupplier(supplier);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedSupplier(null);
    setModalOpen(false);
  };

  const handleSave = async (formData) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (formData.id) { // Update
        await axios.put(`http://localhost:5000/api/suppliers/${formData.id}`, formData, config);
      } else { // Create
        await axios.post('http://localhost:5000/api/suppliers', formData, config);
      }
      fetchSuppliers(); // Refetch data
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save supplier', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`http://localhost:5000/api/suppliers/${id}`, config);
      fetchSuppliers(); // Refetch data
    } catch (err) {
      console.error('Failed to delete supplier', err);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'contact_person', headerName: 'Contact Person', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'phone_number', headerName: 'Phone', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => {
        if (!canManageSuppliers) return null;
        return (
          <Box>
            <Button onClick={() => handleOpenModal(params.row)} size="small">Edit</Button>
            <Button onClick={() => handleDelete(params.row.id)} size="small" color="error">Delete</Button>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Suppliers</Typography>
        {canManageSuppliers && (
          <Button variant="contained" onClick={() => handleOpenModal()}>Create New Supplier</Button>
        )}
      </Box>
      <DataGrid
        rows={suppliers}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        loading={loading}
      />
      <SupplierModal
        open={modalOpen}
        onClose={handleCloseModal}
        supplier={selectedSupplier}
        onSave={handleSave}
      />
    </Box>
  );
};

export default SuppliersPage;
