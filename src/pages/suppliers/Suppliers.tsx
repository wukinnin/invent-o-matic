import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateEditSupplierDialog } from '@/components/suppliers/CreateEditSupplierDialog';
import { showError, showSuccess } from '@/utils/toast';

export type Supplier = {
  id: number;
  name: string;
  contact_info: string;
};

const fetchSuppliers = async (tenantId: number): Promise<Supplier[]> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name, contact_info')
    .eq('tenant_id', tenantId)
    .eq('is_archived', false)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Supplier[];
};

const SuppliersPage = () => {
  const { profile } = useSession();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const [isCreateEditDialogOpen, setCreateEditDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', tenantId],
    queryFn: () => fetchSuppliers(tenantId!),
    enabled: !!tenantId,
  });

  const archiveMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      const { error } = await supabase.from('suppliers').update({ is_archived: true }).eq('id', supplierId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Supplier archived successfully.');
      queryClient.invalidateQueries({ queryKey: ['suppliers', tenantId] });
      setArchiveDialogOpen(false);
    },
    onError: (error) => {
      showError(`Failed to archive supplier: ${error.message}`);
    },
  });

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setCreateEditDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setCreateEditDialogOpen(true);
  };

  const handleArchive = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setArchiveDialogOpen(true);
  };

  const filteredSuppliers = suppliers?.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_info?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <header className="flex justify-between items-center pb-4 mb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage all suppliers for your department.</p>
        </div>
        <Button onClick={handleCreate}>Create New Supplier</Button>
      </header>

      <div className="mb-6">
        <Input
          placeholder="Search by name or contact info..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-36 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredSuppliers?.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-pre-wrap">{supplier.contact_info}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleArchive(supplier)}>Archive</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {tenantId && <CreateEditSupplierDialog
        isOpen={isCreateEditDialogOpen}
        onOpenChange={setCreateEditDialogOpen}
        supplier={selectedSupplier}
        tenantId={tenantId}
      />}

      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving this supplier will hide them from this list. You can restore them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedSupplier && archiveMutation.mutate(selectedSupplier.id)}>
              Confirm Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuppliersPage;