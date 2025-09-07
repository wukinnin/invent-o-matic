import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Users,
  Truck,
  ArrowLeftRight,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/inventory', icon: Boxes, label: 'Inventory' },
  { href: '/suppliers', icon: Truck, label: 'Suppliers' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/users', icon: Users, label: 'Users', managerOnly: true },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const TenantLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile, signOut } = useSession();
  const location = useLocation();

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  const filteredNavItems = navItems.filter(item => 
    !item.managerOnly || (item.managerOnly && profile?.role === 'MANAGER')
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={cn(
        "bg-gray-800 text-gray-100 p-6 flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-24" : "w-64"
      )}>
        <div className="flex items-center justify-center relative mb-6">
          <h1 className={cn(
            "text-2xl font-bold text-white whitespace-nowrap transition-all duration-300", 
            isCollapsed && "opacity-0 invisible w-0"
          )}>
            Inventify
          </h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute -right-10 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-white rounded-full h-7 w-7"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        <nav className="flex-1 space-y-2">
          {filteredNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = location.pathname === href;
            return (
              <Tooltip key={href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to={href}
                    className={cn(
                      "flex items-center p-3 rounded-lg transition-colors",
                      isActive ? "bg-gray-700" : "hover:bg-gray-700",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className={cn("ml-4 font-medium whitespace-nowrap", isCollapsed && "hidden")}>{label}</span>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    <p>{label}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        <div className="mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className={cn(
                "flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors",
                isCollapsed && "justify-center"
              )}>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={undefined} />
                  <AvatarFallback>{getInitials(profile?.first_name, profile?.last_name)}</AvatarFallback>
                </Avatar>
                <div className={cn("ml-3 text-left", isCollapsed && "hidden")}>
                  <p className="text-sm font-semibold whitespace-nowrap">{profile?.first_name} {profile?.last_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{profile?.role.toLowerCase()}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-500 focus:text-red-500 focus:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default TenantLayout;