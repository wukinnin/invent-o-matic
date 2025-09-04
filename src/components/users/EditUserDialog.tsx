import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ALL_PERMISSIONS, PERMISSION_DESCRIPTIONS, Permission } from '@/constants/permissions';
import { TenantUser } from '@/pages/users/UserManagement';

const editUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  permissions: z.array(z.string()),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: TenantUser | null;
  tenantId: number;
}

export const EditUserDialog = ({ isOpen, onOpenChange, user, tenantId }: EditUserDialogProps) => {
  const queryClient = useQueryClient();
  const isManager = user?.role === 'MANAGER';

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        permissions: user.permissions || [],
      });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: async (data: EditUserFormValues) => {
      if (!user) throw new Error('No user selected');

      // 1. Update user's name
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ first_name: data.firstName, last_name: data.lastName })
        .eq('id', user.id);
      if (userUpdateError) throw userUpdateError;

      // 2. Clear existing permissions for the user
      const { error: deleteError } = await supabase.from('user_permissions').delete().eq('user_id', user.id);
      if (deleteError) throw deleteError;

      // 3. Insert new permissions if any are selected
      if (data.permissions.length > 0) {
        const newPermissions = data.permissions.map(p => ({
          user_id: user.id,
          tenant_id: tenantId,
          permission: p,
        }));
        const { error: insertError } = await supabase.from('user_permissions').insert(newPermissions);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      showSuccess('User updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['tenant_users', tenantId] });
      onOpenChange(false);
    },
    onError: (error) => {
      showError(`Failed to update user: ${error.message}`);
    },
  });

  const onSubmit = (data: EditUserFormValues) => {
    mutation.mutate(data);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit User: {user.first_name} {user.last_name}</DialogTitle>
          <DialogDescription>Update user details and manage their permissions.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="edit-user-form" className="space-y-4 pt-4">
          <div>
            <h3 className="font-semibold mb-2">User Details</h3>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Permissions</h3>
            {isManager ? (
              <Alert>
                <AlertTitle>Managers have all permissions</AlertTitle>
                <AlertDescription>
                  You cannot edit permissions for a Manager. To change permissions, first remove their Manager role.
                </AlertDescription>
              </Alert>
            ) : (
              <Controller
                name="permissions"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {ALL_PERMISSIONS.map((permission: Permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={field.value?.includes(permission)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, permission])
                              : field.onChange(field.value?.filter((p) => p !== permission));
                          }}
                        />
                        <Label htmlFor={permission} className="font-normal">
                          {PERMISSION_DESCRIPTIONS[permission]}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              />
            )}
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="edit-user-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};