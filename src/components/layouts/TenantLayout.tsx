import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { SidebarNav } from './SidebarNav';
import { ChevronsLeft, ChevronsRight, Menu, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const fetchTenantName = async (tenantId: number) => {
  const { data, error } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single();
  if (error) throw new Error(error.message);
  return data?.name;
};

const fetchLocationName = async (locationId: number) => {
  const { data, error } = await supabase
    .from('locations')
    .select('name')
    .eq('id', locationId)
    .single();
  if (error) throw new Error(error.message);
  return data?.name;
};

const TenantLayout = () => {
  const { profile, signOut } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: tenantName } = useQuery({
    queryKey: ['tenant_name', profile?.tenant_id],
    queryFn: () => fetchTenantName(profile!.tenant_id!),
    enabled: !!profile?.tenant_id,
  });

  const { data: locationName } = useQuery({
    queryKey: ['location_name', profile?.location_id],
    queryFn: () => fetchLocationName(profile!.location_id!),
    enabled: !!profile?.location_id,
  });

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const closeSheet = () => setIsSheetOpen(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && <h1 className="text-xl font-bold text-white">Inventory</h1>}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex text-white hover:bg-gray-700 hover:text-white">
            {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
          </Button>
        </div>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <SidebarNav isCollapsed={isCollapsed} onLinkClick={closeSheet} />
      </div>
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed && profile && (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white truncate">{profile.first_name} {profile.last_name}</p>
            {tenantName && <p className="text-xs text-gray-300 truncate">{tenantName}</p>}
            {locationName && (
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Building className="h-3 w-3" />
                <span className="truncate">{locationName}</span>
              </div>
            )}
            <span className="text-xs text-gray-400 uppercase">{profile.role}</span>
          </div>
        )}
        <Button variant="outline" className="w-full mt-4 bg-gray-800 border-gray-600 text-white hover:bg-gray-700" onClick={signOut}>
          {isCollapsed ? 'Exit' : 'Sign Out'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`hidden md:flex flex-col bg-gray-800 text-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between md:hidden">
          <h1 className="text-xl font-bold">Inventory</h1>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-gray-800 text-white border-r-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TenantLayout;