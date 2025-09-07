import { useState, ForwardRefExoticComponent, RefAttributes } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Package, LogOut, Settings, Users, ArrowRightLeft, Building, LucideProps, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type NavLinkType = {
  to: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  label: string;
  managerOnly?: boolean;
  disabled?: boolean;
};

const TenantSidebar = () => {
  const { profile, signOut } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isManager = profile?.role === 'MANAGER';

  const { data: tenant } = useQuery({
    queryKey: ['tenant', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;
      const { data, error } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', profile.tenant_id)
        .single();
      if (error) {
        console.error("Error fetching tenant name:", error);
        return null;
      };
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const navLinks: NavLinkType[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inventory', icon: Package, label: 'Inventory' },
    { to: '/suppliers', icon: Building, label: 'Suppliers' },
    { to: '/transactions', icon: ArrowRightLeft, label: 'Transactions' },
    { to: '/users', icon: Users, label: 'User Management', managerOnly: true },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={cn("bg-gray-800 text-gray-100 p-4 flex flex-col transition-all duration-300 ease-in-out", isCollapsed ? "w-20" : "w-64")}>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className={cn("text-xl font-bold text-white transition-opacity whitespace-nowrap", isCollapsed ? "opacity-0 w-0" : "opacity-100")}>Invent O'Matic</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-300 hover:bg-gray-700 hover:text-white">
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
        </div>

        <div className="mb-8 px-2 text-center space-y-1">
          <div className={cn("font-semibold text-white truncate transition-opacity", isCollapsed ? "opacity-0 h-0" : "opacity-100")}>
            {profile?.first_name} {profile?.last_name}
          </div>
          {tenant && (
            <div className={cn("text-sm text-gray-300 truncate transition-opacity", isCollapsed ? "opacity-0 h-0" : "opacity-100")}>
              {tenant.name}
            </div>
          )}
          {profile && <span className={cn("text-xs text-gray-400 uppercase transition-opacity", isCollapsed ? "opacity-0 h-0" : "opacity-100")}>{profile.role}</span>}
        </div>

        <nav className="flex-1 flex flex-col space-y-1">
          {navLinks.map((link) => {
            if (link.managerOnly && !isManager) return null;
            return (
              <Tooltip key={link.label}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center px-3 py-2 rounded-md font-medium text-gray-300 hover:bg-gray-700 hover:text-white',
                        isActive && 'bg-gray-900 text-white',
                        link.disabled && 'opacity-50 cursor-not-allowed',
                        isCollapsed && 'justify-center'
                      )
                    }
                    onClick={(e) => link.disabled && e.preventDefault()}
                  >
                    <link.icon className="h-5 w-5 flex-shrink-0" />
                    <span className={cn("transition-all whitespace-nowrap", isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3")}>{link.label}</span>
                  </NavLink>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">{link.label}</TooltipContent>}
              </Tooltip>
            );
          })}
        </nav>
      </div>
      <div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" className={cn("w-full flex items-center justify-start text-gray-300 hover:bg-gray-700 hover:text-white", isCollapsed && "justify-center")} onClick={signOut}>
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