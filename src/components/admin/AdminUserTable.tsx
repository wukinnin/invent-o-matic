import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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

type TenantUser = {
  id: string;
  first_name: string;
  last_name: string;
  school_id: string;
  role: 'STAFF' | 'MANAGER';
  account_status: string;
  location_id: number | null;
};

type Location = {
    id: number;
    name: string;
};

interface AdminUserTableProps {
    tenantId: number;
    tenantName?: string;
}

type SortKey = 'name' | 'school_id' | 'location' | 'role';
type SortDirection = 'asc' | 'desc';

const fetchTenantUsers = async (tenantId: number): Promise<TenantUser[]> => {
    const { data, error } = await supabase.from('users').select('id, first_name, last_name, school_id, role, account_status, location_id').eq('tenant_id', tenantId);
    if (error) throw new Error(error.message);
    return data;
};

const fetchLocations = async (tenantId: number): Promise<Location[]> => {
    const { data, error } = await supabase.from('locations').select('id, name').eq('tenant_id', tenantId).eq('is_archived', false);
    if (error) throw new Error(error.message);
    return data;
};

export const AdminUserTable = ({ tenantId, tenantName }: AdminUserTableProps) => {
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'asc' });
    
    const { data: users, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['admin_tenant_users', tenantId],
        queryFn: () => fetchTenantUsers(tenantId),
    });

    const { data: locations, isLoading: isLoadingLocations } = useQuery({
        queryKey: ['locations', tenantId],
        queryFn: () => fetchLocations(tenantId),
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

    const locationMap = useMemo(() => {
        if (!locations) return new Map();
        return new Map(locations.map(loc => [loc.id, loc.name]));
    }, [locations]);

    const sortedUsers = useMemo(() => {
        if (!users) return [];
        const sortableUsers = [...users];
        sortableUsers.sort((a, b) => {
            let aValue: string, bValue: string;
            if (sortConfig.key === 'name') {
                aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
                bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
            } else if (sortConfig.key === 'school_id') {
                aValue = a.school_id;
                bValue = b.school_id;
            } else if (sortConfig.key === 'location') {
                aValue = a.location_id ? locationMap.get(a.location_id) ?? '' : 'Tenant-wide';
                bValue = b.location_id ? locationMap.get(b.location_id) ?? '' : 'Tenant-wide';
            } else if (sortConfig.key === 'role') {
                aValue = a.role.toLowerCase();
                bValue = b.role.toLowerCase();
            } else {
                return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableUsers;
    }, [users, sortConfig, locationMap]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' 
          ? <ArrowUp className="ml-2 h-4 w-4 inline" /> 
          : <ArrowDown className="ml-2 h-4 w-4 inline" />;
    };

    const copyToClipboard = () => {
        if (tempPassword) {
            navigator.clipboard.writeText(tempPassword);
            showSuccess('Password copied!');
        }
    };

    const isLoading = isLoadingUsers || isLoadingLocations;
    const hasLocations = locations && locations.length > 0;

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
                                <TableHead><Button variant="ghost" onClick={() => requestSort('name')} className="px-0 hover:bg-transparent">Name {getSortIcon('name')}</Button></TableHead>
                                <TableHead><Button variant="ghost" onClick={() => requestSort('school_id')} className="px-0 hover:bg-transparent">School ID {getSortIcon('school_id')}</Button></TableHead>
                                {hasLocations && <TableHead><Button variant="ghost" onClick={() => requestSort('location')} className="px-0 hover:bg-transparent">Location {getSortIcon('location')}</Button></TableHead>}
                                <TableHead><Button variant="ghost" onClick={() => requestSort('role')} className="px-0 hover:bg-transparent">Role {getSortIcon('role')}</Button></TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={hasLocations ? 6 : 5}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                            ) : (
                                sortedUsers.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                                        <TableCell>{user.school_id}</TableCell>
                                        {hasLocations && <TableCell>{user.location_id ? locationMap.get(user.location_id) ?? 'N/A' : 'Tenant-wide'}</TableCell>}
                                        <TableCell><Badge variant={user.role === 'MANAGER' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                                        <TableCell><Badge variant="outline">{user.account_status.replace(/_/g, ' ')}</Badge></TableCell>
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