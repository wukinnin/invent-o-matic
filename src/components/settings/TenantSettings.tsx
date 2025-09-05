import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Skeleton } from '../ui/skeleton';

const tenantNameSchema = z.object({
  name: z.string().min(3, 'Tenant name must be at least 3 characters'),
});
type TenantNameFormValues = z.infer<typeof tenantNameSchema>;

const fetchTenant = async (tenantId: number) => {
  const { data, error } = await supabase.from('tenants').select('name').eq('id', tenantId).single();
  if (error) throw error;
  return data;
};

export const TenantSettings = () => {
  const { profile, signOut } = useSession();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;
  const [confirmationText, setConfirmationText] = useState('');

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => fetchTenant(tenantId!),
    enabled: !!tenantId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isNameSubmitting },
  } = useForm<TenantNameFormValues>({
    resolver: zodResolver(tenantNameSchema),
    values: { name: tenant?.name || '' },
  });

  const nameMutation = useMutation({
    mutationFn: async (data: TenantNameFormValues) => {
      if (!tenantId) throw new Error('Tenant not found.');
      const { error } = await supabase.from('tenants').update({ name: data.name }).eq('id', tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Tenant name updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    },
    onError: (error) => {
      showError(`Failed to update tenant name: ${error.message}`);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error('Tenant not found.');
      const { error } = await supabase.from('tenants').update({ is_active: false }).eq('id', tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Tenant deactivated. You will be logged out.');
      setTimeout(signOut, 2000);
    },
    onError: (error) => {
      showError(`Failed to deactivate tenant: ${error.message}`);
    },
  });

  const onNameSubmit = (data: TenantNameFormValues) => nameMutation.mutate(data);
  const handleDeactivate = () => deactivateMutation.mutate();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader><CardTitle>Tenant Details</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-24 w-full" /> : (
            <form onSubmit={handleSubmit(onNameSubmit)} className="space-y-6">
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="tenantName">Tenant Name</Label>
                <Input id="tenantName" {...register('name')} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="pt-4 border-t flex justify-end">
                <Button type="submit" disabled={isNameSubmitting}>
                  {isNameSubmitting ? 'Saving...' : 'Save Tenant Name'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-500">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Critical, irreversible actions for this tenant.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold">Deactivate Tenant</h4>
              <p className="text-sm text-gray-600">This will prevent all users from logging in.</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Deactivate This Tenant</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone without admin intervention. To confirm, please type{' '}
                    <strong className="text-red-600">{tenant?.name}</strong> into the box below.
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
                    onClick={handleDeactivate}
                    disabled={confirmationText !== tenant?.name || deactivateMutation.isPending}
                  >
                    {deactivateMutation.isPending ? 'Deactivating...' : 'I understand, deactivate'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};