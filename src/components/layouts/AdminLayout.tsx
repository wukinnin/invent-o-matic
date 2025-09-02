import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminSidebar = () => {
  const navLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/tenant-management', icon: Building, label: 'Tenant Management' },
  ];

  return (
    <aside className="w-60 bg-gray-900 text-gray-200 p-6 flex flex-col">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">Invent O'Matic</h2>
        <span className="text-xs text-gray-400 uppercase">System Admin</span>
      </div>
      <nav className="flex flex-col space-y-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md font-medium text-gray-300 hover:bg-indigo-600 hover:text-white',
                isActive && 'bg-indigo-600 text-white'
              )
            }
          >
            <link.icon className="h-5 w-5" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;