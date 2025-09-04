import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { InventoryItem } from '@/pages/inventory/Inventory';

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
  item: InventoryItem | null;
  tenantId: number;
}

export const CreateEditItemDialog = ({ isOpen, onOpenChange, item, tenantId }: CreateEditItemDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!item;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
  });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        sku: item.sku,
        unit_of_measure: item.unit_of_measure,
        current_stock: item.current_stock,
        minimum_level: item.minimum_level,
      });
    } else {
      reset({
        name: '',
        sku: '',
        unit_of_measure: '',
        current_stock: 0,
        minimum_level: 0,
      });
    }
  }, [item, reset]);

  const mutation = useMutation({
    mutationFn: async (data: ItemFormValues) => {
      if (isEditMode) {
        const { error } = await supabase
          .from('inventory_items')
          .update({ ...data, tenant_id: tenantId })
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .insert({ ...data, tenant_id: tenantId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(`Item ${isEditMode ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['inventory', tenantId] });
      onOpenChange(false);
    },
    onError: (error) => {
      showError(`Failed to ${isEditMode ? 'update' : 'create'} item: ${error.message}`);
    },
  });

  const onSubmit = (data: ItemFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Item' : 'Create New Item'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details of this inventory item.' : 'Add a new item to your inventory.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="item-form">
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Optional)</Label>
              <Input id="sku" {...register('sku')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_of_measure">Unit of Measure</Label>
              <Input id="unit_of_measure" placeholder="e.g., Box, Liter, Pack" {...register('unit_of_measure')} />
              {errors.unit_of_measure && <p className="text-sm text-red-600">{errors.unit_of_measure.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_stock">Current Stock</Label>
              <Input id="current_stock" type="number" {...register('current_stock')} />
              {errors.current_stock && <p className="text-sm text-red-600">{errors.current_stock.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimum_level">Minimum Level</Label>
              <Input id="minimum_level" type="number" {...register('minimum_level')} />
              {errors.minimum_level && <p className="text-sm text-red-600">{errors.minimum_level.message}</p>}
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="item-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};