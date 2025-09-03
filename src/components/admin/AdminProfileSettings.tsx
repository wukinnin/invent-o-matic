import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const AdminProfileSettings = () => {
  const { profile } = useSession();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!profile) throw new Error('User profile not found.');
      const { error } = await supabase.from('users').update(data).eq('id', profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['session'] }); 
    },
    onError: (error) => {
      showError(`Failed to update profile: ${error.message}`);
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...register('first_name')} />
            {errors.first_name && <p className="text-sm text-red-600">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...register('last_name')} />
            {errors.last_name && <p className="text-sm text-red-600">{errors.last_name.message}</p>}
          </div>
          <div className="space-y-2 max-w-sm">
            <Label>Admin ID</Label>
            <Input value={profile?.school_id} disabled />
          </div>
          <div className="pt-4 border-t flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};