import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const tenantSchema = z.object({
  name: z.string().min(3, { message: 'Tenant name must be at least 3 characters long' }),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

interface CreateTenantDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const CreateTenantDialog = ({ isOpen, onOpenChange }: CreateTenantDialogProps) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: TenantFormValues) => {
      const { error } = await supabase.from('tenants').insert({ name: data.name, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Tenant created successfully!');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      onOpenChange(false);
      reset();
    },
    onError: (error) => {
      showError(`Failed to create tenant: ${error.message}`);
    },
  });

  const onSubmit = (data: TenantFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tenant Name</Label>
              <Input
                id="name"
                placeholder="e.g., Department of Chemistry"
                {...register('name')}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Save Tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};