import { useState, ForwardRefExoticComponent, RefAttributes } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, Settings, Users, ArrowRightLeft, Building, LucideProps, ChevronsLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type NavLinkType = {
  to: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  label: string;
  managerOnly?: boolean;
  disabled?: boolean;
};

const fetchTenantName = async (tenantId: number) => {
  const { data, error } = await supabase.from('tenants').select('name').eq('id', tenantId).single();
  if (error) throw error;
  return data?.name;
};

const TenantSidebar = () => {
  const { profile, signOut } = useSession();
  const isManager = profile?.role === 'MANAGER';
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: tenantName } = useQuery({
    queryKey: ['tenantName', profile?.tenant_id],
    queryFn: () => fetchTenantName(profile!.tenant_id!),
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
    <aside className={cn(
      "bg-gray-800 text-gray-100 p-4 flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-60"
    )}>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed && <h2 className="text-xl font-bold text-white">Invent O'Matic</h2>}
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-300 hover:bg-gray-700 hover:text-white">
            <ChevronsLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>
        
        <div className="mb-8 px-2">
          {!isCollapsed && profile && (
            <>
              <p className="text-sm font-semibold text-white truncate">{profile.first_name} {profile.last_name}</p>
              {tenantName && <p className="text-xs text-gray-300 truncate">{tenantName}</p>}
              <span className="text-xs text-gray-400 uppercase">{profile.role}</span>
            </>
          )}
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
                        'flex items-center space-x-3 px-3 py-2 rounded-md font-medium text-gray-300 hover:bg-gray-700 hover:text-white',
                        isActive && 'bg-gray-900 text-white',
                        link.disabled && 'opacity-50 cursor-not-allowed',
                        isCollapsed && 'justify-center'
                      )
                    }
                    onClick={(e) => link.disabled && e.preventDefault()}
                  >
                    <link.icon className="h-5 w-5" />
                    {!isCollapsed && <span>{link.label}</span>}
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
            <Button variant="ghost" className={cn("w-full text-gray-300 hover:bg-gray-700 hover:text-white", isCollapsed ? 'justify-center' : 'justify-start')} onClick={signOut}>
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