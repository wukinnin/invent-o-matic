import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { format } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateEditItemDialog } from '@/components/inventory/CreateEditItemDialog';

export type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  unit_of_measure: string;
  current_stock: number;
  minimum_level: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updated_at: string;
};

const fetchInventory = async (tenantId: number): Promise<InventoryItem[]> => {
  const { data, error } = await supabase.rpc('get_tenant_inventory', { p_tenant_id: tenantId });
  if (error) throw new Error(error.message);
  return data as InventoryItem[];
};

const InventoryPage = () => {
  const { profile } = useSession();
  // DEV NOTE: Bypassing auth, hardcoding tenant_id to 1 for development.
  const tenantId = profile?.tenant_id || 1;

  const [isCreateEditDialogOpen, setCreateEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', tenantId],
    queryFn: () => fetchInventory(tenantId),
    enabled: !!tenantId,
  });

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setCreateEditDialogOpen(true);
  };
  
  const handleCreate = () => {
    setSelectedItem(null);
    setCreateEditDialogOpen(true);
  };

  const getStatusVariant = (status: InventoryItem['status']) => {
    switch (status) {
      case 'IN_STOCK': return 'success';
      case 'LOW_STOCK': return 'secondary';
      case 'OUT_OF_STOCK': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <header className="flex justify-between items-center pb-4 mb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-gray-600 mt-1">Manage all items for your department.</p>
        </div>
        <Button onClick={handleCreate}>Create New Item</Button>
      </header>

      <div className="flex gap-4 mb-6">
        <Input placeholder="Search by name or SKU..." className="flex-grow" />
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="IN_STOCK">In Stock</SelectItem>
            <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
            <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-36 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                inventory?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>{item.name}</div>
                      <div className="text-xs text-gray-500">{item.unit_of_measure}</div>
                    </TableCell>
                    <TableCell className="text-right">{item.current_stock}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(item.updated_at), 'PPP')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                      {/* Archive button to be added later */}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateEditItemDialog
        isOpen={isCreateEditDialogOpen}
        onOpenChange={setCreateEditDialogOpen}
        item={selectedItem}
        tenantId={tenantId}
      />
    </div>
  );
};

export default InventoryPage;