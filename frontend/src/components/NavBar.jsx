import React, { useContext } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const NavBar = () => {
  const { logout } = useContext(AuthContext);

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Invent O'Matic
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            Inventory
          </Button>
          <Button color="inherit" component={RouterLink} to="/suppliers">
            Suppliers
          </Button>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
