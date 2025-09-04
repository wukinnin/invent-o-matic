import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import { SessionProvider } from "./contexts/SessionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import ManagerRoute from "./components/auth/ManagerRoute";
import AdminLayout from "./components/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import TenantManagement from "./pages/admin/TenantManagement";
import AdminSettingsPage from "./pages/admin/Settings";
import TenantLayout from "./components/layouts/TenantLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import InventoryPage from "./pages/inventory/Inventory";
import SuppliersPage from "./pages/suppliers/Suppliers";
import TransactionsPage from "./pages/transactions/Transactions";
import UserManagementPage from "./pages/users/UserManagement";
import SettingsPage from "./pages/settings/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/tenant-management" element={<TenantManagement />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/set-password" element={<SetPassword />} />
              
              <Route element={<TenantLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                
                <Route element={<ManagerRoute />}>
                  <Route path="/users" element={<UserManagementPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;