import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Container, Typography, Box, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AuthContext from '../context/AuthContext';

const InventoryPage = () => {
  const { logout, token } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        const res = await axios.get('http://localhost:5000/api/inventory', config);
        setRows(res.data);
      } catch (err) {
        console.error('Failed to fetch inventory', err);
        alert('Could not load inventory. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInventory();
    }
  }, [token]);

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    { field: 'quantity', headerName: 'Quantity', type: 'number', width: 120 },
    { field: 'category', headerName: 'Category', width: 150 },
    { field: 'last_updated', headerName: 'Last Updated', width: 200, type: 'dateTime', valueGetter: (value) => new Date(value) },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Inventory Dashboard
          </Typography>
          <Button variant="contained" color="error" onClick={logout}>
            Logout
          </Button>
        </Box>
        <Paper style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default InventoryPage;
