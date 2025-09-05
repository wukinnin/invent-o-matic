import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tenant } from '@/pages/admin/TenantManagement';

// Schemas
const managerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  schoolId: z.string().regex(/^\d{8}$/, 'School ID must be 8 digits'),
});
const tenantNameSchema = z.object({
  name: z.string().min(3, 'Tenant name must be at least 3 characters'),
});

// Types
type ManagerFormValues = z.infer<typeof managerSchema>;
type TenantNameFormValues = z.infer<typeof tenantNameSchema>;
type Manager = { first_name: string; last_name: string; school_id: string };

interface ManageTenantDialogProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Helper to fetch managers
const fetchTenantManagers = async (tenantId: number): Promise<Manager[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('first_name, last_name, school_id')
    .eq('tenant_id', tenantId)
    .eq('role', 'MANAGER');
  if (error) throw new Error(error.message);
  return data;
};

export const ManageTenantDialog = ({ tenant, isOpen, onOpenChange }: ManageTenantDialogProps) => {
  const queryClient = useQueryClient();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');

  // Query for existing managers to determine modal state
  const { data: managers, isLoading: isLoadingManagers } = useQuery({
    queryKey: ['tenant_managers', tenant?.id],
    queryFn: () => fetchTenantManagers(tenant!.id),
    enabled: !!tenant && isOpen,
  });

  // Forms
  const provisionForm = useForm<ManagerFormValues>({ resolver: zodResolver(managerSchema) });
  const tenantNameForm = useForm<TenantNameFormValues>({ resolver: zodResolver(tenantNameSchema) });

  useEffect(() => {
    if (tenant) {
      tenantNameForm.reset({ name: tenant.name });
    }
    if (!isOpen) {
        // Reset state on close
        setTimeout(() => {
            setTempPassword(null);
            setConfirmationText('');
            provisionForm.reset();
        }, 200);
    }
  }, [tenant, isOpen, tenantNameForm, provisionForm]);

  // Mutations
  const provisionMutation = useMutation({
    mutationFn: async (data: ManagerFormValues) => {
      const { data: result, error } = await supabase.functions.invoke('provision-manager', {
        body: {
          tenant_id: tenant?.id,
          first_name: data.firstName,
          last_name: data.lastName,
          school_id: data.schoolId,
        },
      });
      if (error) throw new Error(error.message);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      showSuccess('Manager provisioned successfully!');
      setTempPassword(data.tempPassword);
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error) => showError(`Failed to provision manager: ${error.message}`),
  });

  const updateNameMutation = useMutation({
    mutationFn: async (data: TenantNameFormValues) => {
      const { error } = await supabase.from('tenants').update({ name: data.name }).eq('id', tenant!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Tenant name updated.');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      onOpenChange(false);
    },
    onError: (error) => showError(`Update failed: ${error.message}`),
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tenants').update({ is_active: false }).eq('id', tenant!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Tenant has been deactivated.');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      onOpenChange(false);
    },
    onError: (error) => showError(`Deactivation failed: ${error.message}`),
  });

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      showSuccess('Password copied!');
    }
  };

  const renderContent = () => {
    // Priority 1: Always show temp password if it exists
    if (tempPassword) {
      return (
        <div className="py-4 space-y-4">
          <Alert>
            <AlertTitle>Manager Account Created!</AlertTitle>
            <AlertDescription>Securely deliver this temporary password to the new manager.</AlertDescription>
          </Alert>
          <div className="flex items-center space-x-2">
            <Input readOnly value={tempPassword} className="font-mono" />
            <Button variant="outline" size="icon" onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button>
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full">Done</Button>
        </div>
      );
    }

    if (isLoadingManagers) {
      return <Skeleton className="h-64 w-full" />;
    }

    // State 1: No Manager Present (Provisioning)
    if (!managers || managers.length === 0) {
      return (
        <form onSubmit={provisionForm.handleSubmit(data => provisionMutation.mutate(data))} className="space-y-4 pt-4">
          <DialogDescription>This tenant needs an initial manager. Create their account below.</DialogDescription>
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...provisionForm.register('firstName')} />
            {provisionForm.formState.errors.firstName && <p className="text-sm text-red-600">{provisionForm.formState.errors.firstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...provisionForm.register('lastName')} />
            {provisionForm.formState.errors.lastName && <p className="text-sm text-red-600">{provisionForm.formState.errors.lastName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolId">School ID</Label>
            <Input id="schoolId" placeholder="8-digit ID" {...provisionForm.register('schoolId')} />
            {provisionForm.formState.errors.schoolId && <p className="text-sm text-red-600">{provisionForm.formState.errors.schoolId.message}</p>}
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={provisionMutation.isPending}>{provisionMutation.isPending ? 'Provisioning...' : 'Provision Manager'}</Button>
          </DialogFooter>
        </form>
      );
    }

    // State 2: Manager Exists (Full Management)
    return (
      <div className="pt-4 space-y-6">
        <form onSubmit={tenantNameForm.handleSubmit(data => updateNameMutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name-edit">Tenant Name</Label>
            <Input id="tenant-name-edit" {...tenantNameForm.register('name')} />
            {tenantNameForm.formState.errors.name && <p className="text-sm text-red-600">{tenantNameForm.formState.errors.name.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={updateNameMutation.isPending}>
            {updateNameMutation.isPending ? 'Saving...' : 'Save Tenant Name'}
          </Button>
        </form>

        <div>
          <h3 className="font-semibold mb-2 border-t pt-4">Tenant Managers</h3>
          <ul className="text-sm text-gray-600 list-disc list-inside">
            {managers.map(m => <li key={m.school_id}>{m.first_name} {m.last_name} (ID: {m.school_id})</li>)}
          </ul>
        </div>

        <div className="border-t-2 border-red-200 pt-4">
          <h3 className="font-semibold text-red-700">Danger Zone</h3>
          <p className="text-sm text-gray-600 mb-4">This will prevent all users from logging in. Data is preserved.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">Deactivate This Tenant</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  To confirm deactivation, type the tenant's name: <strong className="text-red-600">{tenant?.name}</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type tenant name to confirm"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deactivateMutation.mutate()}
                  disabled={confirmationText !== tenant?.name || deactivateMutation.isPending}
                >
                  {deactivateMutation.isPending ? 'Deactivating...' : 'I understand, deactivate'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  };

  if (!tenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage: {tenant.name}</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};