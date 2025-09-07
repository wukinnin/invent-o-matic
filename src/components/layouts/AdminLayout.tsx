import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building, Settings, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={cn("bg-gray-900 text-gray-200 p-4 flex flex-col justify-between transition-all duration-300 ease-in-out", isCollapsed ? "w-20" : "w-64")}>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className={cn("text-xl font-bold text-white transition-opacity whitespace-nowrap", isCollapsed ? "opacity-0 w-0" : "opacity-100")}>Invent O'Matic</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-300 hover:bg-indigo-600 hover:text-white">
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
        </div>

        <div className="mb-8 px-2 text-center space-y-1">
          <div className={cn("font-semibold text-white truncate transition-opacity", isCollapsed ? "opacity-0 h-0" : "opacity-100")}>
            {profile?.first_name} {profile?.last_name}
          </div>
          <span className={cn("text-xs text-gray-400 uppercase transition-opacity", isCollapsed ? "opacity-0 h-0" : "opacity-100")}>System Admin</span>
        </div>

        <nav className="flex flex-col space-y-2">
          {navLinks.map((link) => (
            <Tooltip key={link.to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center px-3 py-2 rounded-md font-medium text-gray-300 hover:bg-indigo-600 hover:text-white',
                      isActive && 'bg-indigo-600 text-white',
                      isCollapsed && 'justify-center'
                    )
                  }
                >
                  <link.icon className="h-5 w-5 flex-shrink-0" />
                  <span className={cn("transition-all whitespace-nowrap", isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3")}>{link.label}</span>
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
            <Button variant="ghost" className={cn("w-full flex items-center justify-start text-gray-300 hover:bg-indigo-600 hover:text-white", isCollapsed && "justify-center")} onClick={signOut}>
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className={cn("transition-all whitespace-nowrap", isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3")}>Sign Out</span>
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