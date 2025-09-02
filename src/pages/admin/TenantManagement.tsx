import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTenantDialog } from '@/components/admin/CreateTenantDialog';
import { ManageTenantDialog } from '@/components/admin/ManageTenantDialog';
import { showError, showSuccess } from '@/utils/toast';

export type Tenant = {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
};

const fetchTenants = async (): Promise<Tenant[]> => {
  const { data, error } = await supabase.rpc('get_tenants_with_user_count');
  if (error) throw new Error(error.message);
  return data as Tenant[];
};

const TenantManagement = () => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isManageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: fetchTenants,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const { error } = await supabase.from('tenants').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Tenant status updated.');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error) => {
      showError(`Failed to update status: ${error.message}`);
    },
  });

  const handleManageClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setManageDialogOpen(true);
  };

  return (
    <div>
      <header className="flex justify-between items-center pb-4 mb-8 border-b">
        <div>
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <p className="text-gray-600 mt-1">Create, manage, and provision university departments.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>Create New Tenant</Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">User Count</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="space-x-2"><Skeleton className="h-8 w-36" /></TableCell>
                  </TableRow>
                ))
              ) : (
                tenants?.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.is_active ? 'success' : 'secondary'}>
                        {tenant.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{tenant.user_count}</TableCell>
                    <TableCell>{format(new Date(tenant.created_at), 'PPP')}</TableCell>
                    <TableCell className="flex items-center space-x-4">
                      <Switch
                        checked={tenant.is_active}
                        onCheckedChange={(checked) => updateStatusMutation.mutate({ id: tenant.id, is_active: checked })}
                        aria-label="Toggle tenant status"
                      />
                      <Button variant="outline" size="sm" onClick={() => handleManageClick(tenant)}>
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateTenantDialog isOpen={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
      <ManageTenantDialog tenant={selectedTenant} isOpen={isManageDialogOpen} onOpenChange={setManageDialogOpen} />
    </div>
  );
};

export default TenantManagement;