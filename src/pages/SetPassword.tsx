import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';

const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

const SetPassword = () => {
  const { session, refetchProfile } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
  });

  const onSubmit = async (data: SetPasswordFormValues) => {
    if (!session?.user) {
      showError('No active session found. Please sign in again.');
      return;
    }
    setServerError(null);

    // Step 1: Update the user's password in Supabase Auth
    const { error: updateUserError } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (updateUserError) {
      setServerError('Failed to update password. Please try again.');
      return;
    }

    // Step 2: Update the user's account status in the public users table
    const { error: updateProfileError } = await supabase
      .from('users')
      .update({ account_status: 'ACTIVE' })
      .eq('id', session.user.id);

    if (updateProfileError) {
      setServerError('Failed to activate account. Please contact support.');
      return;
    }

    showSuccess('Account activated successfully! Redirecting...');
    
    // Manually refetch the profile to update the context
    await refetchProfile();
    // The useEffect in SessionContext will now handle the redirect.
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Activate Your Account</h1>
          <h2 className="text-lg text-gray-600 mt-2">
            Please set a permanent password to continue.
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter a secure password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="h-5">
                {serverError && (
                  <p className="text-sm text-red-600">{serverError}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Activating...' : 'Activate Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetPassword;