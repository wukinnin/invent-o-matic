import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_PERMISSIONS, PERMISSION_DESCRIPTIONS, Permission } from '@/constants/permissions';
import { TenantUser } from '@/pages/users/UserManagement';
import { Location } from '@/components/settings/LocationsManager';
import { Copy, AlertTriangle } from 'lucide-react';

const editUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['STAFF', 'MANAGER']),
  permissions: z.array(z.string()),
  locationId: z.string().optional(),
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
  const { profile } = useSession();
  const [isDeactivateAlertOpen, setDeactivateAlertOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const isTargetManager = user?.role === 'MANAGER';
  const isSelf = user?.id === profile?.id;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
  });

  const watchedRole = watch('role');

  const { data: locations, isLoading: isLoadingLocations } = useQuery<Location[]>({
    queryKey: ['locations', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('id, name').eq('tenant_id', tenantId).eq('is_archived', false);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && isOpen,
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        role: user.role,
        permissions: user.permissions || [],
        locationId: user.location_id ? String(user.location_id) : 'NONE',
      });
    }
  }, [user, reset]);

  useEffect(() => {
    if (watchedRole === 'MANAGER') {
      setValue('locationId', 'NONE');
    }
  }, [watchedRole, setValue]);

  const handleDialogChange = (open: boolean) => {
    if (!open) {
        setTimeout(() => {
            setTempPassword(null);
        }, 300);
    }
    onOpenChange(open);
  };

  const updateMutation = useMutation({
    mutationFn: async (data: EditUserFormValues) => {
      if (!user) throw new Error('No user selected');
      const location_id = data.locationId && data.locationId !== 'NONE' ? parseInt(data.locationId) : null;
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
          location_id: location_id,
        })
        .eq('id', user.id);
      if (userUpdateError) throw userUpdateError;
      const { error: deleteError } = await supabase.from('user_permissions').delete().eq('user_id', user.id);
      if (deleteError) throw deleteError;
      if (data.role === 'STAFF' && data.permissions.length > 0) {
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
      handleDialogChange(false);
    },
    onError: (error) => {
      showError(`Failed to update user: ${error.message}`);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: 'ACTIVE' | 'INACTIVE') => {
      if (!user) throw new Error('No user selected');
      const { error } = await supabase.from('users').update({ account_status: newStatus }).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: (_, newStatus) => {
      showSuccess(`User has been ${newStatus === 'INACTIVE' ? 'inactivated' : 'activated'}.`);
      queryClient.invalidateQueries({ queryKey: ['tenant_users', tenantId] });
      setDeactivateAlertOpen(false);
    },
    onError: (error) => {
      showError(`Failed to update status: ${error.message}`);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user selected');
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { target_user_id: user.id },
      });
      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      showSuccess('Password has been reset.');
      setTempPassword(data.tempPassword);
    },
    onError: (error) => {
      showError(`Failed to reset password: ${error.message}`);
    },
  });

  const onSubmit = (data: EditUserFormValues) => {
    updateMutation.mutate(data);
  };

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      showSuccess('Password copied!');
    }
  };

  if (!user) return null;

  const canEditRoleAndStatus = !isTargetManager && !isSelf;
  const showPermissions = watchedRole === 'STAFF';

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit User: {user.first_name} {user.last_name}</DialogTitle>
          {!tempPassword && <DialogDescription>Update user details, role, and permissions.</DialogDescription>}
        </DialogHeader>
        
        {tempPassword ? (
          <div className="py-4 space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Password Reset Successfully</AlertTitle>
              <AlertDescription>
                Please securely deliver this temporary password to the user. They will be required to change it on their next login.
              </AlertDescription>
            </Alert>
            <div className="flex items-center space-x-2">
              <Input readOnly value={tempPassword} className="font-mono" />
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => handleDialogChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} id="edit-user-form" className="space-y-4 pt-4">
              <div>
                <h3 className="font-semibold mb-2 text-gray-800">User Details</h3>
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
                <div className="space-y-2 mt-4">
                  <Label htmlFor="locationId">Location</Label>
                  <Controller
                    name="locationId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingLocations || watchedRole === 'MANAGER'}>
                        <SelectTrigger><SelectValue placeholder="Select a location..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">Tenant-wide Access</SelectItem>
                          {locations?.map(loc => <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2 text-gray-800">Role</h3>
                {canEditRoleAndStatus ? (
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="role-switch">Staff</Label>
                        <Switch
                          id="role-switch"
                          checked={field.value === 'MANAGER'}
                          onCheckedChange={(checked) => field.onChange(checked ? 'MANAGER' : 'STAFF')}
                        />
                        <Label htmlFor="role-switch">Manager</Label>
                      </div>
                    )}
                  />
                ) : (
                  <Alert variant="info">
                    <AlertDescription>
                      {isSelf ? "You cannot change your own role." : "The role of a Manager can only be changed by a System Admin."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2 text-gray-800">Permissions</h3>
                {showPermissions ? (
                  <Controller
                    name="permissions"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
                            <Label htmlFor={permission} className="font-normal text-sm">{PERMISSION_DESCRIPTIONS[permission]}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                ) : (
                  <Alert>
                    <AlertTitle>Managers have all permissions</AlertTitle>
                    <AlertDescription>Permissions are automatically granted and cannot be edited.</AlertDescription>
                  </Alert>
                )}
              </div>
            </form>

            <Card className="mt-6 border-red-500">
              <CardHeader><CardTitle className="text-red-700">Danger Zone</CardTitle></CardHeader>
              <CardContent className="space-y-4 divide-y">
                {canEditRoleAndStatus && (
                  <div className="flex justify-between items-center pt-4 first:pt-0">
                    <div>
                      <h4 className="font-semibold">Account Status</h4>
                      <p className="text-sm text-gray-600">Inactivating an account will prevent the user from logging in.</p>
                    </div>
                    <AlertDialog open={isDeactivateAlertOpen} onOpenChange={setDeactivateAlertOpen}>
                      <AlertDialogTrigger asChild>
                        {user.account_status === 'ACTIVE' ? (
                          <Button variant="destructive">Inactivate User</Button>
                        ) : (
                          <Button variant="secondary">Reactivate User</Button>
                        )}
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {user.account_status === 'ACTIVE'
                              ? "This will prevent the user from accessing the system. Their data will be preserved."
                              : "This will restore the user's access to the system."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => statusMutation.mutate(user.account_status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                            disabled={statusMutation.isPending}
                          >
                            {statusMutation.isPending ? 'Updating...' : 'Confirm'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 first:pt-0">
                  <div>
                    <h4 className="font-semibold">Force Password Reset</h4>
                    <p className="text-sm text-gray-600">Generate a temporary password for the user.</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isSelf || user.role !== 'STAFF'}>Reset Password</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will immediately invalidate the user's current password. You must securely provide them with the new temporary password.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => resetPasswordMutation.mutate()} disabled={resetPasswordMutation.isPending}>
                          {resetPasswordMutation.isPending ? 'Resetting...' : 'Confirm Reset'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>Cancel</Button>
              <Button type="submit" form="edit-user-form" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};