import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
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
import { InventoryItem, InventoryItemStatus } from '@/types/inventory';

interface InventoryTableProps {
  inventory: InventoryItem[];
  isLoading: boolean;
  onEdit: (id: number) => void;
}

const StatusBadge = ({ status }: { status: InventoryItemStatus }) => {
  const statusMap: Record<InventoryItemStatus, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
    IN_STOCK: { label: 'In Stock', variant: 'success' },
    LOW_STOCK: { label: 'Low Stock', variant: 'warning' },
    OUT_OF_STOCK: { label: 'Out of Stock', variant: 'destructive' },
  };
  const { label, variant } = statusMap[status] || { label: 'Unknown', variant: 'secondary' };
  return <Badge variant={variant}>{label}</Badge>;
};

export const InventoryTable = ({ inventory, isLoading, onEdit }: InventoryTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item Name</TableHead>
          <TableHead>SKU</TableHead>
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
              <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
            </TableRow>
          ))
        ) : inventory.length > 0 ? (
          inventory.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <div>{item.name}</div>
                <div className="text-xs text-gray-500">{item.unit_of_measure}</div>
              </TableCell>
              <TableCell className="font-mono text-sm">{item.sku || 'N/A'}</TableCell>
              <TableCell className="text-right">{item.current_stock}</TableCell>
              <TableCell><StatusBadge status={item.status} /></TableCell>
              <TableCell>{format(new Date(item.updated_at), 'PPP')}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onEdit(item.id)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center h-24">No inventory items found.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};