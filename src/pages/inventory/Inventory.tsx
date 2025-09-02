import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { CreateEditItemDialog } from '@/components/inventory/CreateEditItemDialog';
import { InventoryItem } from '@/types/inventory';

const fetchInventory = async (tenantId: number): Promise<InventoryItem[]> => {
  const { data, error } = await supabase.rpc('get_tenant_inventory', { p_tenant_id: tenantId });
  if (error) throw new Error(error.message);
  return data as InventoryItem[];
};

const Inventory = () => {
  const { profile } = useSession();
  // DEV NOTE: Hardcoding tenant_id for development
  const tenantId = profile?.tenant_id || 1;

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', tenantId],
    queryFn: () => fetchInventory(tenantId),
    enabled: !!tenantId,
  });

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inventory, searchTerm, statusFilter]);

  const handleEdit = (id: number) => {
    setSelectedItemId(id);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedItemId(null);
    setDialogOpen(true);
  };
  
  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedItemId(null);
  }

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
        <Input
          placeholder="Search by name or SKU..."
          className="flex-grow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="IN_STOCK">In Stock</SelectItem>
            <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
            <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <InventoryTable
          inventory={filteredInventory}
          isLoading={isLoading}
          onEdit={handleEdit}
        />
      </Card>

      <CreateEditItemDialog
        isOpen={isDialogOpen}
        onOpenChange={closeDialog}
        tenantId={tenantId}
        itemId={selectedItemId}
      />
    </div>
  );
};

export default Inventory;