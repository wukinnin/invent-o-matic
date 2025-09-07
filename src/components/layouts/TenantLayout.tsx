import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Package,
  Truck,
  Settings,
  LogOut,
  BarChart3,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import NavLink from './NavLink';
import { Separator } from '@/components/ui/separator';
import { useTenant } from '@/contexts/TenantProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/users', label: 'User Management', icon: Users },
];

const TenantLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { tenant, userProfile, loading } = useTenant();
  const { toast } = useToast();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full mt-2" />
          </div>
        </aside>
        <main className="flex-1 p-6 bg-gray-100">
          <Skeleton className="h-full w-full" />
        </main>
      </div>
    );
  }

  const getInitials = (firstName, lastName) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-gray-100">
        <aside
          className={cn(
            'bg-gray-800 text-white flex flex-col transition-all duration-300 ease-in-out relative',
            isCollapsed ? 'w-20' : 'w-64'
          )}
        >
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className={cn("flex items-center gap-3 p-4", isCollapsed ? 'justify-center' : 'justify-start')}>
              <Avatar>
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback>{getInitials(userProfile?.first_name, userProfile?.last_name)}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-semibold text-sm truncate">{`${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`}</span>
                  <span className="text-xs text-gray-400 truncate">{tenant?.name}</span>
                </div>
              )}
            </div>
            
            <Separator className="bg-gray-700" />

            <nav className="flex-1 px-3 py-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  label={item.label}
                  icon={item.icon}
                  isCollapsed={isCollapsed}
                  isActive={location.pathname === item.href}
                />
              ))}
            </nav>
          </div>

          <div className="p-3 border-t border-gray-700 space-y-2">
            <NavLink
              to="/settings"
              label="Settings"
              icon={Settings}
              isCollapsed={isCollapsed}
              isActive={location.pathname.startsWith('/settings')}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className={cn("w-full flex items-center gap-3 text-gray-300 hover:bg-gray-700 hover:text-white", isCollapsed ? 'justify-center px-0' : 'justify-start')} onClick={signOut}>
                  <LogOut className="h-5 w-5" />
                  {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>Sign Out</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          <div className="absolute -right-3 top-1/2 -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white hover:bg-gray-100 text-gray-800 h-6 w-6"
              onClick={toggleSidebar}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default TenantLayout;