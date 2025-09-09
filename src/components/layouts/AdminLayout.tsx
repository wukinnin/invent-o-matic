import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building, Settings, LogOut, ChevronsLeft, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const AdminSidebar = () => {
  const { profile, signOut } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/tenant-management', icon: Building, label: 'Tenant Management' },
    { to: '/admin/users', icon: Users, label: 'User Management' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={cn(
      "bg-gray-900 text-gray-200 p-4 flex flex-col justify-between transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-60"
    )}>
      <div>
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed && <h2 className="text-xl font-bold text-white">Invent O'Matic</h2>}
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-300 hover:bg-indigo-600 hover:text-white">
            <ChevronsLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>
        
        <div className="mb-8 px-2">
          {!isCollapsed && profile && (
            <>
              <p className="text-sm font-semibold text-white truncate">{profile.first_name} {profile.last_name}</p>
              <span className="text-xs text-gray-400 uppercase">System Admin</span>
            </>
          )}
        </div>

        <nav className="flex flex-col space-y-2">
          {navLinks.map((link) => (
            <Tooltip key={link.to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-md font-medium text-gray-300 hover:bg-indigo-600 hover:text-white',
                      isActive && 'bg-indigo-600 text-white',
                      isCollapsed && 'justify-center'
                    )
                  }
                >
                  <link.icon className="h-5 w-5" />
                  {!isCollapsed && <span>{link.label}</span>}
                </NavLink>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">{link.label}</TooltipContent>}
            </Tooltip>
          ))}
        </nav>
      </div>
      <div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" className={cn("w-full text-gray-300 hover:bg-indigo-600 hover:text-white", isCollapsed ? 'justify-center' : 'justify-start')} onClick={signOut}>
              <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>Sign Out</span>}
            </Button>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  );
};

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;