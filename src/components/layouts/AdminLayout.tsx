import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  LogOut,
  Building,
  ChevronsLeft,
  ChevronsRight,
  FileText,
} from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

const NavItem = ({ to, icon, children, isCollapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <NavLink
      to={to}
      className={`flex items-center gap-4 p-3 rounded-lg text-sm transition-colors ${
        isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
      } ${isCollapsed ? 'justify-center' : ''}`}
    >
      {icon}
      {!isCollapsed && <span className="font-medium">{children}</span>}
    </NavLink>
  );
};

const AdminLayout = () => {
  const { profile, signOut } = useSession();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [tenantName, setTenantName] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.tenant_id && (profile.role === 'MANAGER' || profile.role === 'STAFF')) {
      const fetchTenantName = async () => {
        const { data, error } = await supabase
          .from('tenants')
          .select('name')
          .eq('id', profile.tenant_id)
          .single();

        if (error) {
          console.error('Error fetching tenant name:', error);
        } else {
          setTenantName(data.name);
        }
      };
      fetchTenantName();
    }
  }, [profile?.tenant_id, profile?.role]);

  const getInitials = (firstName, lastName) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`bg-gray-900 text-gray-200 p-4 flex flex-col justify-between transition-all duration-300 relative ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-9 z-10 bg-gray-800 text-white rounded-full p-1.5 hover:bg-gray-700 transition-colors"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
        
        <div>
          <div className={`flex items-center gap-3 mb-8 h-8 ${isSidebarCollapsed ? 'justify-center' : 'px-3'}`}>
            <Package className="h-8 w-8 text-white flex-shrink-0" />
            {!isSidebarCollapsed && <h2 className="text-xl font-bold text-white truncate">Invent O'Matic</h2>}
          </div>
          <nav className="space-y-2">
            {profile?.role === 'ADMIN' && (
              <>
                <NavItem to="/admin/dashboard" icon={<LayoutDashboard className="h-5 w-5 flex-shrink-0" />} isCollapsed={isSidebarCollapsed}>
                  Dashboard
                </NavItem>
                <NavItem to="/admin/tenants" icon={<Building className="h-5 w-5 flex-shrink-0" />} isCollapsed={isSidebarCollapsed}>
                  Tenants
                </NavItem>
              </>
            )}
            {profile?.role === 'MANAGER' && (
              <>
                <NavItem to="/dashboard" icon={<LayoutDashboard className="h-5 w-5 flex-shrink-0" />} isCollapsed={isSidebarCollapsed}>
                  Dashboard
                </NavItem>
                <NavItem to="/inventory" icon={<Package className="h-5 w-5 flex-shrink-0" />} isCollapsed={isSidebarCollapsed}>
                  Inventory
                </NavItem>
                <NavItem to="/transactions" icon={<FileText className="h-5 w-5 flex-shrink-0" />} isCollapsed={isSidebarCollapsed}>
                  Transactions
                </NavItem>
                <NavItem to="/users" icon={<Users className="h-5 w-5 flex-shrink-0" />} isCollapsed={isSidebarCollapsed}>
                  Users
                </NavItem>
              </>
            )}
            {profile?.role === 'STAFF' && (
              <>
                <NavItem to="/dashboard" icon={<LayoutDashboard className="h-5 w-5 flex-shrink-0" />} isCollapsed={isSidebarCollapsed}>
                  Dashboard
                </NavItem>
                <NavItem to="/inventory" icon={<Package className="h-5 w-5 flex-shrink-0" />} isCollapsed={isSidebarCollapsed}>
                  Inventory
                </NavItem>
                 <NavItem to="/transactions" icon={<FileText className="h-5 w-5 flex-shrink-0" />} isCollapsed={isSidebarCollapsed}>
                  Transactions
                </NavItem>
              </>
            )}
          </nav>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={undefined} alt="User avatar" />
              <AvatarFallback>{getInitials(profile?.first_name, profile?.last_name)}</AvatarFallback>
            </Avatar>
            {!isSidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-sm truncate">{profile?.first_name} {profile?.last_name}</p>
                {tenantName && <p className="text-xs text-gray-400 truncate">{tenantName}</p>}
                <p className="text-xs text-gray-400 capitalize">{profile?.role?.toLowerCase()}</p>
              </div>
            )}
          </div>
          <button
            onClick={signOut}
            className={`w-full mt-4 flex items-center gap-4 p-3 rounded-lg text-sm hover:bg-gray-700 transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;