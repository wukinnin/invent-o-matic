import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Copy, KeyRound, ArrowUp, ArrowDown } from 'lucide-react';
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
import { cn } from '@/lib/utils';

type TenantUser = {
  id: string;
  first_name: string;
  last_name: string;
  school_id: string;
  role: 'STAFF' | 'MANAGER';
  account_status: string;
  locations: { name: string } | null;
};

type SortKey = 'name' | 'school_id' | 'role' | 'account_status' | 'location';

interface AdminUserTableProps {
    tenantId: number;
    tenantName?: string;
}

const fetchTenantUsers = async (tenantId: number): Promise<TenantUser[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, school_id, role, account_status, locations(name)')
      .eq('tenant_id', tenantId);
    if (error) throw new Error(error.message);
    return data;
};

export const AdminUserTable = ({ tenantId, tenantName }: AdminUserTableProps) => {
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin_tenant_users', tenantId],
        queryFn: () => fetchTenantUsers(tenantId),
    });

    const hasLocations = useMemo(() => users?.some(user => user.locations), [users]);

    const sortedUsers = useMemo(() => {
        if (!users) return [];
        const sorted = [...users];
        sorted.sort((a, b) => {
            let aValue: string | null = '';
            let bValue: string | null = '';

            switch (sortConfig.key) {
                case 'name':
                    aValue = `${a.first_name} ${a.last_name}`;
                    bValue = `${b.first_name} ${b.last_name}`;
                    break;
                case 'location':
                    aValue = a.locations?.name ?? null;
                    bValue = b.locations?.name ?? null;
                    break;
                default:
                    aValue = a[sortConfig.key as Exclude<SortKey, 'name' | 'location'>];
                    bValue = b[sortConfig.key as Exclude<SortKey, 'name' | 'location'>];
            }

            if (aValue === null) return 1;
            if (bValue === null) return -1;
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [users, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ children, sortKey }: { children: React.ReactNode, sortKey: SortKey }) => {
        const isSorted = sortConfig.key === sortKey;
        const Icon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;
        return (
            <TableHead className="cursor-pointer select-none" onClick={() => requestSort(sortKey)}>
                <div className="flex items-center space-x-1">
                    <span>{children}</span>
                    {isSorted && <Icon className="h-4 w-4" />}
                </div>
            </TableHead>
        );
    };

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
                                <SortableHeader sortKey="name">Name</SortableHeader>
                                <SortableHeader sortKey="school_id">School ID</SortableHeader>
                                {hasLocations && <SortableHeader sortKey="location">Location</SortableHeader>}
                                <SortableHeader sortKey="role">Role</SortableHeader>
                                <SortableHeader sortKey="account_status">Status</SortableHeader>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={hasLocations ? 6 : 5}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                            ) : (
                                sortedUsers?.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                                        <TableCell>{user.school_id}</TableCell>
                                        {hasLocations && <TableCell>{user.locations?.name || <span className="text-gray-400">N/A</span>}</TableCell>}
                                        <TableCell><Badge variant={user.role === 'MANAGER' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                                        <TableCell><Badge variant="outline" className="capitalize">{user.account_status.replace(/_/g, ' ')}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            {user.role === 'MANAGER' ? (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm"><KeyRound className="mr-2 h-4 w-4" />Reset Password</Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Reset Manager Password?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will invalidate their current password and force a reset. This action is for recovery purposes.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => passwordResetMutation.mutate(user.id)}>Confirm</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : (
                                                <Button variant="outline" size="sm" disabled>Reset Password</Button>
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