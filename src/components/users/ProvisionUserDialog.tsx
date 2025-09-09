import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Location } from '@/components/settings/LocationsManager';

const provisionUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  schoolId: z.string().regex(/^\d{8}$/, 'School ID must be 8 digits'),
  isManager: z.boolean().default(false),
  locationId: z.string().optional(),
});

type ProvisionUserFormValues = z.infer<typeof provisionUserSchema>;

interface ProvisionUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tenantId: number;
}

export const ProvisionUserDialog = ({ isOpen, onOpenChange, tenantId }: ProvisionUserDialogProps) => {
  const queryClient = useQueryClient();
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProvisionUserFormValues>({
    resolver: zodResolver(provisionUserSchema),
    defaultValues: { isManager: false },
  });

  const isManager = watch('isManager');

  useEffect(() => {
    if (isManager) {
      setValue('locationId', 'NONE');
    }
  }, [isManager, setValue]);

  const { data: locations, isLoading: isLoadingLocations } = useQuery<Location[]>({
    queryKey: ['locations', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('id, name').eq('tenant_id', tenantId).eq('is_archived', false);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && isOpen,
  });

  const mutation = useMutation({
    mutationFn: async (data: ProvisionUserFormValues) => {
      const { data: result, error } = await supabase.functions.invoke('provision-user', {
        body: {
          tenant_id: tenantId,
          first_name: data.firstName,
          last_name: data.lastName,
          school_id: data.schoolId,
          role: data.isManager ? 'MANAGER' : 'STAFF',
          location_id: data.locationId && data.locationId !== 'NONE' ? parseInt(data.locationId) : null,
        },
      });
      if (error) throw new Error(error.message);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      showSuccess('User provisioned successfully!');
      setTempPassword(data.tempPassword);
      queryClient.invalidateQueries({ queryKey: ['tenant_users', tenantId] });
    },
    onError: (error) => {
      showError(`Failed to provision user: ${error.message}`);
    },
  });

  const onSubmit = (data: ProvisionUserFormValues) => {
    mutation.mutate(data);
  };

  const handleDialogClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setTempPassword(null);
      reset();
    }, 300);
  };

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      showSuccess('Password copied to clipboard!');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Provision New User</DialogTitle>
          <DialogDescription>
            Create a new account for a staff or manager in your department.
          </DialogDescription>
        </DialogHeader>
        
        {tempPassword ? (
          <div className="py-4 space-y-4">
            <Alert>
              <AlertTitle>User Account Created!</AlertTitle>
              <AlertDescription>
                Please securely deliver this temporary password to the new user. They must change it upon first login.
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
            <div className="space-y-2">
              <Label htmlFor="schoolId">School ID</Label>
              <Input id="schoolId" placeholder="8-digit ID" {...register('schoolId')} />
              {errors.schoolId && <p className="text-sm text-red-600">{errors.schoolId.message}</p>}
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Controller
                name="isManager"
                control={control}
                render={({ field }) => (
                  <Switch id="isManager" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label htmlFor="isManager">Make this user a Manager</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationId">Assign to Location</Label>
              <Controller
                name="locationId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingLocations || isManager}>
                    <SelectTrigger><SelectValue placeholder="Select a location..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Tenant-wide Access</SelectItem>
                      {locations?.map(loc => <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Provisioning...' : 'Provision User'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};