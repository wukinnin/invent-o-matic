import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Location } from './LocationsManager';

const locationSchema = z.object({
  name: z.string().min(2, 'Location name must be at least 2 characters'),
});

type LocationFormValues = z.infer<typeof locationSchema>;

interface CreateEditLocationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  location: Location | null;
  tenantId: number;
}

export const CreateEditLocationDialog = ({ isOpen, onOpenChange, location, tenantId }: CreateEditLocationDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!location;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
  });

  useEffect(() => {
    if (isOpen) {
        reset({ name: location?.name || '' });
    }
  }, [isOpen, location, reset]);

  const mutation = useMutation({
    mutationFn: async (data: LocationFormValues) => {
      const payload = { ...data, tenant_id: tenantId };
      if (isEditMode) {
        const { error } = await supabase.from('locations').update(payload).eq('id', location.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('locations').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(`Location ${isEditMode ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['locations', tenantId] });
      onOpenChange(false);
    },
    onError: (error) => {
      showError(`Failed to save location: ${error.message}`);
    },
  });

  const onSubmit = (data: LocationFormValues) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Location' : 'Create New Location'}</DialogTitle>
          <DialogDescription>
            Locations help you organize users and inventory into distinct groups.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="location-form">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="location-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};