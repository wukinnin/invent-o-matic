import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Container, Typography, Box, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { AuthContext } from '../context/AuthContext';
import InventoryItemModal from '../components/InventoryItemModal';
import TransactionModal from '../components/TransactionModal';

const InventoryPage = () => {
  const { token, user } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const canManageInventory = user?.permissions?.includes('manage_inventory');
  const canCreateTransaction = user?.permissions?.includes('create_transaction');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:5000/api/inventory', config);
      setRows(res.data);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInventory();
    }
  }, [token]);

  const handleOpenItemModal = (item = null) => {
    setSelectedItem(item);
    setItemModalOpen(true);
  };

  const handleCloseItemModal = () => {
    setSelectedItem(null);
    setItemModalOpen(false);
  };

  const handleSaveItem = async (formData) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (formData.id) { // Update
        await axios.put(`http://localhost:5000/api/inventory/${formData.id}`, formData, config);
      } else { // Create
        await axios.post('http://localhost:5000/api/inventory', formData, config);
      }
      fetchInventory();
      handleCloseItemModal();
    } catch (err) {
      console.error('Failed to save item', err);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`http://localhost:5000/api/inventory/${id}`, config);
      fetchInventory();
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    { field: 'quantity', headerName: 'Quantity', type: 'number', width: 120 },
    { field: 'category', headerName: 'Category', width: 150 },
    { field: 'last_updated', headerName: 'Last Updated', width: 200, type: 'dateTime', valueGetter: (value) => new Date(value) },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => {
        if (!canManageInventory) return null;
        return (
          <Box>
            <Button onClick={() => handleOpenItemModal(params.row)} size="small">Edit</Button>
            <Button onClick={() => handleDeleteItem(params.row.id)} size="small" color="error">Delete</Button>
          </Box>
        );
      },
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">Inventory Dashboard</Typography>
          <Box>
            {canCreateTransaction && (
              <Button variant="contained" onClick={() => setTransactionModalOpen(true)} sx={{ mr: 1 }}>New Transaction</Button>
            )}
            {canManageInventory && (
              <Button variant="contained" color="primary" onClick={() => handleOpenItemModal()}>Create New Item</Button>
            )}
          </Box>
        </Box>
        <Paper style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          />
        </Paper>
      </Box>
      <InventoryItemModal
        open={itemModalOpen}
        onClose={handleCloseItemModal}
        item={selectedItem}
        onSave={handleSaveItem}
      />
      <TransactionModal
        open={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        onTransactionSuccess={fetchInventory}
      />
    </Container>
  );
};

export default InventoryPage;
