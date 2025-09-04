import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Tenant } from '@/pages/admin/TenantManagement';

const managerSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  schoolId: z.string().regex(/^\d{8}$/, { message: 'School ID must be exactly 8 digits' }),
});
type ManagerFormValues = z.infer<typeof managerSchema>;

const tenantNameSchema = z.object({
  name: z.string().min(3, 'Tenant name must be at least 3 characters'),
});
type TenantNameFormValues = z.infer<typeof tenantNameSchema>;

interface ManageTenantDialogProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const ManageTenantDialog = ({ tenant, isOpen, onOpenChange }: ManageTenantDialogProps) => {
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const queryClient = useQueryClient();

  const managerForm = useForm<ManagerFormValues>({ resolver: zodResolver(managerSchema) });
  const tenantNameForm = useForm<TenantNameFormValues>({ resolver: zodResolver(tenantNameSchema) });

  useEffect(() => {
    if (tenant) {
      tenantNameForm.reset({ name: tenant.name });
    }
  }, [tenant, tenantNameForm, isOpen]);

  const provisionMutation = useMutation({
    mutationFn: async (data: ManagerFormValues) => {
      const { data: result, error } = await supabase.functions.invoke('provision-manager', {
        body: { tenant_id: tenant?.id, first_name: data.firstName, last_name: data.lastName, school_id: data.schoolId },
      });
      if (error) throw new Error(error.message);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      showSuccess('Manager provisioned successfully!');
      setTempPassword(data.tempPassword);
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      managerForm.reset();
    },
    onError: (error) => showError(`Failed to provision manager: ${error.message}`),
  });

  const updateNameMutation = useMutation({
    mutationFn: async (data: TenantNameFormValues) => {
      if (!tenant) throw new Error('Tenant not found');
      const { error } = await supabase.from('tenants').update({ name: data.name }).eq('id', tenant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Tenant name updated.');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error) => showError(`Failed to update name: ${error.message}`),
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      if (!tenant) throw new Error('Tenant not found');
      const { error } = await supabase.from('tenants').update({ is_active: false }).eq('id', tenant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Tenant has been deactivated.');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      onOpenChange(false);
    },
    onError: (error) => showError(`Failed to deactivate tenant: ${error.message}`),
  });

  const handleDialogClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setTempPassword(null);
      managerForm.reset();
      setConfirmationText('');
    }, 300);
  };

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      showSuccess('Password copied to clipboard!');
    }
  };

  if (!tenant) return null;

  const hasManager = tenant.user_count > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage: {tenant.name}</DialogTitle>
          <DialogDescription>
            {hasManager ? 'Modify tenant details or perform administrative actions.' : 'Provision the initial manager account for this tenant.'}
          </DialogDescription>
        </DialogHeader>

        {!hasManager ? (
          tempPassword ? (
            <div className="py-4 space-y-4">
              <Alert>
                <AlertTitle>Manager Account Created!</AlertTitle>
                <AlertDescription>Please securely deliver the temporary password to the new manager.</AlertDescription>
              </Alert>
              <div className="flex items-center space-x-2">
                <Input readOnly value={tempPassword} className="font-mono" />
                <Button variant="outline" size="icon" onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button>
              </div>
              <Button onClick={handleDialogClose} className="w-full">Close</Button>
            </div>
          ) : (
            <form onSubmit={managerForm.handleSubmit(d => provisionMutation.mutate(d))} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...managerForm.register('firstName')} />
                {managerForm.formState.errors.firstName && <p className="text-sm text-red-600">{managerForm.formState.errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...managerForm.register('lastName')} />
                {managerForm.formState.errors.lastName && <p className="text-sm text-red-600">{managerForm.formState.errors.lastName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolId">School ID</Label>
                <Input id="schoolId" placeholder="8-digit ID" {...managerForm.register('schoolId')} />
                {managerForm.formState.errors.schoolId && <p className="text-sm text-red-600">{managerForm.formState.errors.schoolId.message}</p>}
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
                <Button type="submit" disabled={provisionMutation.isPending}>{provisionMutation.isPending ? 'Provisioning...' : 'Provision Manager'}</Button>
              </DialogFooter>
            </form>
          )
        ) : (
          <div className="pt-4 space-y-6">
            <form onSubmit={tenantNameForm.handleSubmit(d => updateNameMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-name-edit">Tenant Name</Label>
                <Input id="tenant-name-edit" {...tenantNameForm.register('name')} />
                {tenantNameForm.formState.errors.name && <p className="text-sm text-red-600">{tenantNameForm.formState.errors.name.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={updateNameMutation.isPending}>{updateNameMutation.isPending ? 'Saving...' : 'Save Tenant Name'}</Button>
            </form>

            <div className="pt-6 border-t-2 border-red-200">
              <h3 className="font-semibold text-red-700">Danger Zone</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-600 max-w-xs">Deactivate this tenant and block all users.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="destructive">Deactivate</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will prevent all users from this tenant from logging in. To confirm, type <strong className="text-red-600">{tenant.name}</strong> into the box below.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input value={confirmationText} onChange={(e) => setConfirmationText(e.target.value)} placeholder="Type tenant name to confirm" />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deactivateMutation.mutate()} disabled={confirmationText !== tenant.name || deactivateMutation.isPending}>
                        {deactivateMutation.isPending ? 'Deactivating...' : 'I understand, deactivate'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};