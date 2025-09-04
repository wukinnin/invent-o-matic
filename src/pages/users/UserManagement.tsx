import { useState } from 'react';
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
import { cn } from '@/lib/utils';

export type TenantUser = {
  id: string;
  first_name: string;
  last_name: string;
  school_id: string;
  role: 'STAFF' | 'MANAGER';
  account_status: 'ACTIVE' | 'PENDING_ACTIVATION' | 'DEACTIVATED';
  permissions: string[];
};

const fetchTenantUsers = async (tenantId: number): Promise<TenantUser[]> => {
  const { data, error } = await supabase.rpc('get_tenant_users', { p_tenant_id: tenantId });
  if (error) throw new Error(error.message);
  return data as TenantUser[];
};

const UserManagementPage = () => {
  const { profile } = useSession();
  const tenantId = profile?.tenant_id;

  const [isProvisionDialogOpen, setProvisionDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['tenant_users', tenantId],
    queryFn: () => fetchTenantUsers(tenantId!),
    enabled: !!tenantId,
  });

  const handleEdit = (user: TenantUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const getStatusVariant = (status: TenantUser['account_status']) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING_ACTIVATION': return 'secondary';
      case 'DEACTIVATED': return 'outline';
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
                <TableHead>Name</TableHead>
                <TableHead>School ID</TableHead>
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
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                      {user.role === 'MANAGER' && <Badge variant="outline" className="ml-2">Manager</Badge>}
                    </TableCell>
                    <TableCell>{user.school_id}</TableCell>
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