import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tenant } from './TenantManagement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import { Skeleton } from '@/components/ui/skeleton';

const fetchAllTenants = async (): Promise<Pick<Tenant, 'id' | 'name'>[]> => {
    const { data, error } = await supabase.from('tenants').select('id, name').order('name');
    if (error) throw error;
    return data;
};

const AdminUserManagementPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(searchParams.get('tenantId'));

    const { data: tenants, isLoading: isLoadingTenants } = useQuery({
        queryKey: ['all_tenants_list'],
        queryFn: fetchAllTenants,
    });

    useEffect(() => {
        const tenantIdFromUrl = searchParams.get('tenantId');
        if (tenantIdFromUrl) {
            setSelectedTenantId(tenantIdFromUrl);
        }
    }, [searchParams]);

    const handleTenantChange = (tenantId: string) => {
        setSelectedTenantId(tenantId);
        setSearchParams({ tenantId });
    };
    
    const selectedTenantName = tenants?.find(t => t.id.toString() === selectedTenantId)?.name;

    return (
        <div>
            <header className="pb-4 mb-8 border-b">
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-gray-600 mt-1">Select a tenant to view and manage its users.</p>
            </header>

            <div className="mb-6 max-w-sm">
                <label htmlFor="tenant-select" className="block text-sm font-medium text-gray-700 mb-2">Select Tenant</label>
                {isLoadingTenants ? <Skeleton className="h-10 w-full" /> : (
                    <Select onValueChange={handleTenantChange} value={selectedTenantId ?? ''}>
                        <SelectTrigger id="tenant-select">
                            <SelectValue placeholder="Select a tenant..." />
                        </SelectTrigger>
                        <SelectContent>
                            {tenants?.map(tenant => (
                                <SelectItem key={tenant.id} value={tenant.id.toString()}>{tenant.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {selectedTenantId && (
                <AdminUserTable 
                    key={selectedTenantId} 
                    tenantId={parseInt(selectedTenantId)} 
                    tenantName={selectedTenantName} 
                />
            )}
        </div>
    );
};

export default AdminUserManagementPage;