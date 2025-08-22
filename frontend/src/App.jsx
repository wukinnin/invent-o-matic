import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import { Box } from '@mui/material';

// Layout for protected pages
const ProtectedLayout = ({ children }) => (
  <Box>
    <NavBar />
    <main>{children}</main>
  </Box>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <InventoryPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/suppliers" 
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <SuppliersPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
