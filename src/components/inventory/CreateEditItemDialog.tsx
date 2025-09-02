import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Supplier } from '@/types/inventory';

const itemSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  sku: z.string().optional(),
  unit_of_measure: z.string().min(1, 'Unit of measure is required'),
  current_stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  minimum_level: z.coerce.number().int().min(0, 'Minimum level cannot be negative'),
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface CreateEditItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tenantId: number;
  itemId: number | null;
}

const fetchSuppliers = async (tenantId: number): Promise<Supplier[]> => {
  const { data, error } = await supabase.from('suppliers').select('id, name').eq('tenant_id', tenantId);
  if (error) throw error;
  return data;
};

const fetchItemDetails = async (itemId: number, tenantId: number) => {
  const { data, error } = await supabase.rpc('get_inventory_item_details', { p_item_id: itemId, p_tenant_id: tenantId });
  if (error) throw error;
  return data;
};

export const CreateEditItemDialog = ({ isOpen, onOpenChange, tenantId, itemId }: CreateEditItemDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = itemId !== null;

  const { data: itemDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['inventoryItem', itemId],
    queryFn: () => fetchItemDetails(itemId!, tenantId),
    enabled: isEditMode && isOpen,
  });

  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers', tenantId],
    queryFn: () => fetchSuppliers(tenantId),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && itemDetails) {
        reset(itemDetails);
      } else {
        reset({ name: '', sku: '', unit_of_measure: '', current_stock: 0, minimum_level: 10 });
      }
    }
  }, [isOpen, isEditMode, itemDetails, reset]);

  const mutation = useMutation({
    mutationFn: async (values: ItemFormValues) => {
      // NOTE: The upsert RPC function is not yet created. This is a placeholder.
      // For now, we'll just do a simple insert/update.
      if (isEditMode) {
        const { error } = await supabase.from('inventory_items').update({ ...values, updated_at: new Date().toISOString() }).eq('id', itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('inventory_items').insert({ ...values, tenant_id: tenantId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(`Item ${isEditMode ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['inventory', tenantId] });
      onOpenChange(false);
    },
    onError: (error) => {
      showError(`Failed to save item: ${error.message}`);
    },
  });

  const onSubmit = (data: ItemFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Item' : 'Create New Item'}</DialogTitle>
        </DialogHeader>
        {isEditMode && isLoadingDetails ? (
          <div className="py-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="sku">SKU (Optional)</Label>
                <Input id="sku" {...register('sku')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                <Input id="unit_of_measure" placeholder="e.g., Box, Liter" {...register('unit_of_measure')} />
                {errors.unit_of_measure && <p className="text-sm text-red-600">{errors.unit_of_measure.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="current_stock">Current Stock</Label>
                <Input id="current_stock" type="number" {...register('current_stock')} />
                {errors.current_stock && <p className="text-sm text-red-600">{errors.current_stock.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="minimum_level">Minimum Level</Label>
                <Input id="minimum_level" type="number" {...register('minimum_level')} />
                {errors.minimum_level && <p className="text-sm text-red-600">{errors.minimum_level.message}</p>}
              </div>
            </div>
            {/* Supplier multi-select would go here */}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Item'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};