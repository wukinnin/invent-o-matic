import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Copy, KeyRound, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { showError, showSuccess } from '@/utils/toast';

type TenantUser = {
  id: string;
  first_name: string;
  last_name: string;
  school_id: string;
  role: 'STAFF' | 'MANAGER';
  account_status: string;
};

interface AdminUserTableProps {
    tenantId: number;
    tenantName?: string;
}

const fetchTenantUsers = async (tenantId: number): Promise<TenantUser[]> => {
    const { data, error } = await supabase.from('users').select('id, first_name, last_name, school_id, role, account_status').eq('tenant_id', tenantId);
    if (error) throw new Error(error.message);
    return data;
};

export const AdminUserTable = ({ tenantId, tenantName }: AdminUserTableProps) => {
    const queryClient = useQueryClient();
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin_tenant_users', tenantId],
        queryFn: () => fetchTenantUsers(tenantId),
    });

    const passwordResetMutation = useMutation({
        mutationFn: async (targetUserId: string) => {
          const { data, error } = await supabase.functions.invoke('reset-password', {
            body: { target_user_id: targetUserId },
          });
          if (error) throw new Error(error.message);
          if (data.error) throw new Error(data.error);
          return data;
        },
        onSuccess: (data) => {
          showSuccess("Manager password has been reset.");
          setTempPassword(data.tempPassword);
          setPasswordModalOpen(true);
        },
        onError: (error) => {
          showError(`Reset failed: ${error.message}`);
        },
    });

    const roleManagementMutation = useMutation({
        mutationFn: async ({ targetUserId, newRole }: { targetUserId: string, newRole: 'MANAGER' | 'STAFF' }) => {
            const { data, error } = await supabase.functions.invoke('manage-user-role', {
                body: { 
                    target_user_id: targetUserId,
                    new_role: newRole,
                },
            });
            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            showSuccess("User role updated successfully.");
            queryClient.invalidateQueries({ queryKey: ['admin_tenant_users', tenantId] });
        },
        onError: (error) => {
            showError(`Role change failed: ${error.message}`);
        },
    });

    const copyToClipboard = () => {
        if (tempPassword) {
            navigator.clipboard.writeText(tempPassword);
            showSuccess('Password copied!');
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Users in "{tenantName || 'Selected Tenant'}"</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>School ID</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                            ) : (
                                users?.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                                        <TableCell>{user.school_id}</TableCell>
                                        <TableCell><Badge variant={user.role === 'MANAGER' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                                        <TableCell><Badge variant="outline">{user.account_status.replace(/_/g, ' ')}</Badge></TableCell>
                                        <TableCell className="text-right space-x-2">
                                            
                                            {user.role === 'STAFF' && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm"><ArrowUpCircle className="mr-2 h-4 w-4" />Promote</Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Promote to Manager?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will grant the user full managerial permissions within this tenant. Any specific staff-level permissions will be removed.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => roleManagementMutation.mutate({ targetUserId: user.id, newRole: 'MANAGER' })}>Confirm Promotion</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}

                                            {user.role === 'MANAGER' && (
                                                <>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="outline" size="sm"><ArrowDownCircle className="mr-2 h-4 w-4" />Demote</Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Demote to Staff?</AlertDialogTitle>
                                                                <AlertDialogDescription>This user will lose all managerial permissions. You cannot demote the last manager of a tenant.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => roleManagementMutation.mutate({ targetUserId: user.id, newRole: 'STAFF' })}>Confirm Demotion</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm"><KeyRound className="mr-2 h-4 w-4" />Reset Password</Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Reset Manager Password?</AlertDialogTitle>
                                                                <AlertDialogDescription>This action is for recovery purposes and will force the manager to set a new password on their next login.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => passwordResetMutation.mutate(user.id)}>Confirm</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isPasswordModalOpen} onOpenChange={setPasswordModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Temporary Password Generated</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <Alert><AlertTitle>Action Complete</AlertTitle><AlertDescription>Securely deliver this password to the manager.</AlertDescription></Alert>
                        <div className="flex items-center space-x-2">
                            <Input readOnly value={tempPassword ?? ''} className="font-mono" />
                            <Button variant="outline" size="icon" onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button>
                        </div>
                        <Button onClick={() => setPasswordModalOpen(false)} className="w-full">Done</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};