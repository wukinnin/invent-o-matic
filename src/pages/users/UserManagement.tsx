import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ProvisionUserDialog } from '@/components/users/ProvisionUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { Location } from '@/components/settings/LocationsManager';
import { ArrowUp, ArrowDown } from 'lucide-react';

export type TenantUser = {
  id: string;
  first_name: string;
  last_name: string;
  school_id: string;
  role: 'STAFF' | 'MANAGER';
  account_status: 'ACTIVE' | 'PENDING_ACTIVATION' | 'INACTIVE';
  permissions: string[];
  location_id: number | null;
};

const fetchTenantUsers = async (tenantId: number): Promise<TenantUser[]> => {
  const { data, error } = await supabase.rpc('get_tenant_users', { p_tenant_id: tenantId });
  if (error) throw new Error(error.message);
  return data as TenantUser[];
};

const fetchLocations = async (tenantId: number): Promise<Location[]> => {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('is_archived', false);
  if (error) throw new Error(error.message);
  return data;
};

type SortKey = 'name' | 'school_id' | 'location' | 'role';
type SortDirection = 'asc' | 'desc';

const UserManagementPage = () => {
  const { profile } = useSession();
  const tenantId = profile?.tenant_id;

  const [isProvisionDialogOpen, setProvisionDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'asc' });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['tenant_users', tenantId],
    queryFn: () => fetchTenantUsers(tenantId!),
    enabled: !!tenantId,
  });

  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations', tenantId],
    queryFn: () => fetchLocations(tenantId!),
    enabled: !!tenantId,
  });

  const locationMap = useMemo(() => {
    if (!locations) return new Map();
    return new Map(locations.map(loc => [loc.id, loc.name]));
  }, [locations]);

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    const sortableUsers = [...users];
    if (sortConfig) {
      sortableUsers.sort((a, b) => {
        let aValue: string | number, bValue: string | number;
        if (sortConfig.key === 'name') {
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
        } else if (sortConfig.key === 'school_id') {
          aValue = a.school_id;
          bValue = b.school_id;
        } else if (sortConfig.key === 'location') {
          aValue = a.location_id ? locationMap.get(a.location_id) ?? '' : 'Tenant-wide';
          bValue = b.location_id ? locationMap.get(b.location_id) ?? '' : 'Tenant-wide';
        } else if (sortConfig.key === 'role') {
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
        } else {
          return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig, locationMap]);

  const hasLocations = locations && locations.length > 0;
  const isLoading = isLoadingUsers || isLoadingLocations;

  const handleEdit = (user: TenantUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4 inline" /> 
      : <ArrowDown className="ml-2 h-4 w-4 inline" />;
  };

  const getStatusVariant = (status: TenantUser['account_status']) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING_ACTIVATION': return 'secondary';
      case 'INACTIVE': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <header className="flex justify-between items-center pb-4 mb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Provision new users and manage permissions.</p>
        </div>
        <Button onClick={() => setProvisionDialogOpen(true)}>Provision New User</Button>
      </header>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('name')} className="px-0 hover:bg-transparent">
                    Name {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('school_id')} className="px-0 hover:bg-transparent">
                    School ID {getSortIcon('school_id')}
                  </Button>
                </TableHead>
                {hasLocations && (
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('location')} className="px-0 hover:bg-transparent">
                      Location {getSortIcon('location')}
                    </Button>
                  </TableHead>
                )}
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('role')} className="px-0 hover:bg-transparent">
                    Role {getSortIcon('role')}
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    {hasLocations && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.school_id}</TableCell>
                    {hasLocations && (
                      <TableCell>
                        {user.location_id ? locationMap.get(user.location_id) ?? 'N/A' : 'Tenant-wide'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={user.role === 'MANAGER' ? 'default' : 'secondary'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(user.account_status)}>
                        {user.account_status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {tenantId && (
        <>
          <ProvisionUserDialog
            isOpen={isProvisionDialogOpen}
            onOpenChange={setProvisionDialogOpen}
            tenantId={tenantId}
          />
          <EditUserDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setEditDialogOpen}
            user={selectedUser}
            tenantId={tenantId}
          />
        </>
      )}
    </div>
  );
};

export default UserManagementPage;