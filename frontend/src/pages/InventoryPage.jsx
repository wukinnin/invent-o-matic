import React, { useContext } from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import AuthContext from '../context/AuthContext';

const InventoryPage = () => {
  const { logout } = useContext(AuthContext);

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Inventory Dashboard
        </Typography>
        <Typography variant="body1">Welcome to the inventory page.</Typography>
        <Button variant="contained" onClick={logout} sx={{ mt: 2 }}>
          Logout
        </Button>
      </Box>
    </Container>
  );
};

export default InventoryPage;
