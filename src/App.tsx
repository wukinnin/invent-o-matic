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
import AdminLayout from "./components/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import TenantManagement from "./pages/admin/TenantManagement";
import TenantDashboard from "./pages/dashboard/TenantDashboard";

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
            
            {/* 
              DEVELOPMENT NOTE: 
              Admin routes are temporarily public to bypass login for UI development.
              This is insecure and MUST be reverted by wrapping this section in 
              <ProtectedRoute> and <AdminRoute> before production.
            */}
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/tenant-management" element={<TenantManagement />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/set-password" element={<SetPassword />} />

              {/* Admin Routes were here, now public for development */}

              {/* Tenant Routes */}
              <Route path="/dashboard" element={<TenantDashboard />} />
              
              {/* Root redirect */}
              <Route path="/" element={<Index />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;