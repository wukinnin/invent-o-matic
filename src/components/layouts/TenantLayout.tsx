import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, Settings, Users, ArrowRightLeft, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import React from 'react';

type NavLinkItem = {
  to: string;
  icon: React.ElementType;
  label: string;
  managerOnly?: boolean;
  disabled?: boolean;
};

const TenantSidebar = () => {
  const { profile, signOut } = useSession();
  const isManager = profile?.role === 'MANAGER';

  const navLinks: NavLinkItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inventory', icon: Package, label: 'Inventory' },
    { to: '/suppliers', icon: Building, label: 'Suppliers' },
    { to: '/transactions', icon: ArrowRightLeft, label: 'Transactions' },
    { to: '/users', icon: Users, label: 'User Management', managerOnly: true },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-60 bg-gray-800 text-gray-100 p-4 flex flex-col">
      <div className="mb-8 px-2">
        <h2 className="text-xl font-bold text-white">Invent O'Matic</h2>
        {profile && <span className="text-xs text-gray-400 uppercase">{profile.role}</span>}
      </div>
      <nav className="flex-1 flex flex-col space-y-1">
        {navLinks.map((link) => {
          if (link.managerOnly && !isManager) return null;
          return (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-md font-medium text-gray-300 hover:bg-gray-700 hover:text-white',
                  isActive && 'bg-gray-900 text-white',
                  link.disabled && 'opacity-50 cursor-not-allowed'
                )
              }
              onClick={(e) => link.disabled && e.preventDefault()}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div>
        <Button variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white" onClick={signOut}>
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

const TenantLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <TenantSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default TenantLayout;