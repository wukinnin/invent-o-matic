import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tenant } from '@/pages/admin/TenantManagement';

const managerSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  schoolId: z.string().regex(/^\d{8}$/, { message: 'School ID must be exactly 8 digits' }),
});

type ManagerFormValues = z.infer<typeof managerSchema>;

interface ManageTenantDialogProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const ManageTenantDialog = ({ tenant, isOpen, onOpenChange }: ManageTenantDialogProps) => {
  const queryClient = useQueryClient();
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManagerFormValues>({
    resolver: zodResolver(managerSchema),
  });

  const mutation = useMutation({
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
      reset();
    },
    onError: (error) => {
      showError(`Failed to provision manager: ${error.message}`);
    },
  });

  const onSubmit = (data: ManagerFormValues) => {
    mutation.mutate(data);
  };

  const handleDialogClose = () => {
    onOpenChange(false);
    setTempPassword(null);
    reset();
  };

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      showSuccess('Password copied to clipboard!');
    }
  };

  if (!tenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage: {tenant.name}</DialogTitle>
          <DialogDescription>
            Provision the initial manager account for this tenant.
          </DialogDescription>
        </DialogHeader>
        
        {tempPassword ? (
          <div className="py-4 space-y-4">
            <Alert variant="success">
              <AlertTitle>Manager Account Created!</AlertTitle>
              <AlertDescription>
                Please securely deliver the following temporary password to the new manager. They will be required to change it upon first login.
              </AlertDescription>
            </Alert>
            <div className="flex items-center space-x-2">
              <Input readOnly value={tempPassword} className="font-mono" />
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleDialogClose} className="w-full">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && <p className="text-sm text-red-600">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && <p className="text-sm text-red-600">{errors.lastName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolId">School ID</Label>
              <Input id="schoolId" placeholder="8-digit ID" {...register('schoolId')} />
              {errors.schoolId && <p className="text-sm text-red-600">{errors.schoolId.message}</p>}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Provisioning...' : 'Provision Manager'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};