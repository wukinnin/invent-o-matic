import { useEffect } from 'react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Supplier } from '@/pages/suppliers/Suppliers';

const supplierSchema = z.object({
  name: z.string().min(3, 'Supplier name must be at least 3 characters'),
  contact_info: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface CreateEditSupplierDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  supplier: Supplier | null;
  tenantId: number;
}

export const CreateEditSupplierDialog = ({ isOpen, onOpenChange, supplier, tenantId }: CreateEditSupplierDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!supplier;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        contact_info: supplier.contact_info,
      });
    } else {
      reset({
        name: '',
        contact_info: '',
      });
    }
  }, [supplier, reset]);

  const mutation = useMutation({
    mutationFn: async (data: SupplierFormValues) => {
      if (isEditMode) {
        const { error } = await supabase
          .from('suppliers')
          .update({ ...data, tenant_id: tenantId })
          .eq('id', supplier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert({ ...data, tenant_id: tenantId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(`Supplier ${isEditMode ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['suppliers', tenantId] });
      onOpenChange(false);
    },
    onError: (error) => {
      showError(`Failed to ${isEditMode ? 'update' : 'create'} supplier: ${error.message}`);
    },
  });

  const onSubmit = (data: SupplierFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Supplier' : 'Create New Supplier'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for this supplier.' : 'Add a new supplier to your directory.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="supplier-form">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_info">Contact Info (Person, Phone, Address)</Label>
              <Textarea id="contact_info" {...register('contact_info')} />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="supplier-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Supplier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};